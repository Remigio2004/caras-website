import { useMemo, useRef, useState, useEffect, DragEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  UploadCloud,
  FolderOpen,
  Download,
  MoreVertical,
  Pencil,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface DocumentFile {
  id?: string;
  file_name: string;
  file_url: string;
  public_id: string;
  file_type: string;
  file_size: number | null;
  folder: string;
  folder_description?: string | null;
  uploaded_at?: string;
}

interface FolderRow {
  id: string;
  name: string;
  description: string | null;
}

interface FolderSummary {
  name: string;
  description: string;
  count: number;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function getErrorMessage(err: unknown, duplicateNameFallback?: string) {
  if (err && typeof err === "object") {
    const anyErr = err as { code?: string; message?: string };
    if (duplicateNameFallback && anyErr.code === "23505") {
      return duplicateNameFallback;
    }
    if (anyErr.message) return anyErr.message;
  }
  return String(err);
}

const BUCKET_FOLDER = "caras-documents";
const FILES_PER_PAGE = 6;

export default function DocumentsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [filePage, setFilePage] = useState(1);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
    new Set()
  );
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [deletingFolder, setDeletingFolder] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: dbDocuments, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DocumentFile[];
    },
  });

  const { data: foldersTable } = useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as FolderRow[];
    },
  });

  // Open a folder (or close, when name is null) and reset everything
  // scoped to whichever folder was previously open.
  const openFolder = (name: string | null) => {
    setSelectedFolder(name);
    setFilePage(1);
    setSelectedFileIds(new Set());
    setLastSelectedId(null);
  };

  // Helper: upload a single file (any type) to Cloudinary via the "auto" endpoint,
  // then save the returned URL + metadata in Supabase.
  const uploadSingleDocument = async (
    file: File,
    folder: string,
    folder_description: string
  ) => {
    const nameNoExt = file.name.split(".").slice(0, -1).join(".") || "file";
    const ext = file.name.split(".").pop() || "";
    const safeName = nameNoExt.replace(/[^a-zA-Z0-9-_]/g, "_");

    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string
    );
    formData.append("folder", `${BUCKET_FOLDER}/${folder || "General"}`);
    formData.append("public_id", safeName);

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;

    // "auto" lets Cloudinary detect image/video/raw automatically —
    // requires "Allow unsigned uploads of raw files" enabled on the upload preset.
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Cloudinary upload error", err);
      throw new Error("Cloudinary upload failed");
    }

    const data = (await res.json()) as {
      secure_url: string;
      public_id: string;
      bytes: number;
    };

    const documentData = {
      file_name: file.name,
      file_url: data.secure_url,
      public_id: data.public_id,
      file_type: ext.toLowerCase(),
      file_size: data.bytes || file.size,
      folder,
      folder_description,
    };

    const { error: insertError } = await supabase
      .from("documents")
      .insert(documentData);

    if (insertError) throw insertError;
  };

  // Create an empty folder (name + description only, no files required)
  const createFolderMutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }) => {
      if (!isAdmin) throw new Error("Not authorized");
      const trimmedName = name.trim();
      if (!trimmedName) throw new Error("Folder name is required");

      const { error } = await supabase
        .from("folders")
        .insert({ name: trimmedName, description: description.trim() || null });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast({ title: "Folder created" });
      setIsCreateFolderOpen(false);
      openFolder(variables.name.trim());
    },
    onError: (err) => {
      console.error("createFolder error:", err);
      toast({
        title: "Could not create folder",
        description: getErrorMessage(
          err,
          "A folder with that name already exists."
        ),
        variant: "destructive",
      });
    },
  });

  // Rename / edit description of an existing folder, cascading the new
  // name+description onto every document currently filed under it.
  const renameFolderMutation = useMutation({
    mutationFn: async ({
      oldName,
      newName,
      description,
    }: {
      oldName: string;
      newName: string;
      description: string;
    }) => {
      if (!isAdmin) throw new Error("Not authorized");
      const trimmedName = newName.trim();
      if (!trimmedName) throw new Error("Folder name is required");
      const trimmedDescription = description.trim() || null;

      const { error: folderError } = await supabase
        .from("folders")
        .update({ name: trimmedName, description: trimmedDescription })
        .eq("name", oldName);
      if (folderError) throw folderError;

      const { error: docsError } = await supabase
        .from("documents")
        .update({ folder: trimmedName, folder_description: trimmedDescription })
        .eq("folder", oldName);
      if (docsError) throw docsError;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Folder updated" });
      setRenamingFolder(null);
      setSelectedFolder((prev) =>
        prev === variables.oldName ? variables.newName.trim() : prev
      );
    },
    onError: (err) => {
      console.error("renameFolder error:", err);
      toast({
        title: "Could not update folder",
        description: getErrorMessage(
          err,
          "A folder with that name already exists."
        ),
        variant: "destructive",
      });
    },
  });

  // Upload files (any type) into the currently open folder — used by both
  // the "Add files" button and drag-and-drop onto the drop zone.
  const uploadFilesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!isAdmin) throw new Error("Not authorized");
      if (!selectedFolder) throw new Error("No folder selected");

      const folder_description =
        folders.find((f) => f.name === selectedFolder)?.description || "";

      for (const file of files) {
        await uploadSingleDocument(file, selectedFolder, folder_description);
      }
    },
    onSuccess: (_data, files) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: `${files.length} file${files.length !== 1 ? "s" : ""} added`,
      });
    },
    onError: (err) => {
      console.error("upload files error:", err);
      toast({
        title: "Upload failed",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!isAdmin) throw new Error("Not authorized");
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "File deleted successfully" });
    },
  });

  // Delete several selected files at once
  const deleteSelectedMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!isAdmin) throw new Error("Not authorized");
      if (!ids.length) throw new Error("No files selected");
      const { error } = await supabase.from("documents").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_data, ids) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: `${ids.length} file${ids.length !== 1 ? "s" : ""} deleted`,
      });
      setSelectedFileIds(new Set());
    },
    onError: (err) => {
      console.error("delete selected error:", err);
      toast({
        title: "Delete failed",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  // Move selected files into a different folder (drag-and-drop, or click a chip)
  const moveFilesMutation = useMutation({
    mutationFn: async ({
      ids,
      targetFolder,
    }: {
      ids: string[];
      targetFolder: string;
    }) => {
      if (!isAdmin) throw new Error("Not authorized");
      if (!ids.length) throw new Error("No files selected");

      const targetDescription =
        folders.find((f) => f.name === targetFolder)?.description || null;

      const { data, error } = await supabase
        .from("documents")
        .update({ folder: targetFolder, folder_description: targetDescription })
        .in("id", ids)
        .select("id");
      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "No files were actually moved — this is likely blocked by a Row Level Security (RLS) policy on the 'documents' table in Supabase."
        );
      }

      if (data.length < ids.length) {
        throw new Error(
          `Only ${data.length} of ${ids.length} files were moved — some rows may be blocked by RLS.`
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({
        title: `Moved ${variables.ids.length} file${
          variables.ids.length !== 1 ? "s" : ""
        } to "${variables.targetFolder}"`,
      });
      setSelectedFileIds(new Set());
    },
    onError: (err) => {
      console.error("move files error:", err);
      toast({
        title: "Move failed",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  // Delete whole folder (folders row + all documents filed under it)
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      if (!isAdmin) throw new Error("Not authorized");
      const { error: docsError } = await supabase
        .from("documents")
        .delete()
        .eq("folder", folderName);
      if (docsError) throw docsError;

      const { error: folderError } = await supabase
        .from("folders")
        .delete()
        .eq("name", folderName);
      if (folderError) throw folderError;
    },
    onSuccess: (_data, folderName) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Folder deleted" });
      setDeletingFolder(null);
      setSelectedFolder((prev) => (prev === folderName ? null : prev));
    },
    onError: (err) => {
      console.error("delete folder error:", err);
      toast({
        title: "Delete failed",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  const handleCreateFolderSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) || "";
    const description = (formData.get("description") as string) || "";
    createFolderMutation.mutate({ name, description });
  };

  const handleRenameSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!renamingFolder) return;
    const formData = new FormData(e.currentTarget);
    const newName = (formData.get("name") as string) || "";
    const description = (formData.get("description") as string) || "";
    renameFolderMutation.mutate({ oldName: renamingFolder, newName, description });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      uploadFilesMutation.mutate(files);
    }
    e.target.value = "";
  };

  const allDocuments = useMemo(() => {
    const combined = dbDocuments || [];
    return combined.map((doc) => ({
      ...doc,
      folder: doc.folder || "General",
    })) as DocumentFile[];
  }, [dbDocuments]);

  // Combine the folders table (source of truth, includes empty folders)
  // with any folder names still only referenced by documents.
  const folders = useMemo(() => {
    const map = new Map<string, FolderSummary>();

    (foldersTable || []).forEach((f) => {
      map.set(f.name, { name: f.name, description: f.description || "", count: 0 });
    });

    allDocuments.forEach((doc) => {
      const key = doc.folder || "General";
      if (!map.has(key)) {
        map.set(key, {
          name: key,
          description: doc.folder_description || "",
          count: 0,
        });
      }
      map.get(key)!.count += 1;
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [foldersTable, allDocuments]);

  const filesInSelectedFolder = useMemo(() => {
    if (!selectedFolder) return [];
    return allDocuments.filter(
      (doc) => (doc.folder || "General") === selectedFolder
    );
  }, [allDocuments, selectedFolder]);

  const totalFilePages = Math.max(
    1,
    Math.ceil(filesInSelectedFolder.length / FILES_PER_PAGE)
  );

  const pagedFiles = useMemo(() => {
    const start = (filePage - 1) * FILES_PER_PAGE;
    return filesInSelectedFolder.slice(start, start + FILES_PER_PAGE);
  }, [filesInSelectedFolder, filePage]);

  const handleFileClick = (
    e: React.MouseEvent,
    doc: DocumentFile,
    index: number
  ) => {
    if (!doc.id || !isAdmin) return;

    if (e.shiftKey && lastSelectedId) {
      const anchorIndex = pagedFiles.findIndex((d) => d.id === lastSelectedId);
      if (anchorIndex !== -1) {
        const [start, end] =
          anchorIndex < index ? [anchorIndex, index] : [index, anchorIndex];
        const rangeIds = pagedFiles
          .slice(start, end + 1)
          .map((d) => d.id)
          .filter((id): id is string => !!id);
        setSelectedFileIds(new Set(rangeIds));
        return;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      setSelectedFileIds((prev) => {
        const next = new Set(prev);
        if (next.has(doc.id!)) next.delete(doc.id!);
        else next.add(doc.id!);
        return next;
      });
      setLastSelectedId(doc.id);
      return;
    }

    setSelectedFileIds(new Set([doc.id]));
    setLastSelectedId(doc.id);
  };

  const handleFileDoubleClick = (doc: DocumentFile) => {
    window.open(doc.file_url, "_blank", "noopener,noreferrer");
  };

  const handleBulkDownload = () => {
    selectedFileIds.forEach((id) => {
      const doc = filesInSelectedFolder.find((d) => d.id === id);
      if (!doc) return;
      const link = document.createElement("a");
      link.href = doc.file_url;
      link.download = doc.file_name;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  // Ctrl/Cmd+A selects every file in the folder, across all pagination pages
  useEffect(() => {
    if (!selectedFolder || !isAdmin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedFileIds(
          new Set(
            filesInSelectedFolder
              .map((d) => d.id)
              .filter((id): id is string => !!id)
          )
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFolder, isAdmin, filesInSelectedFolder]);

  const handleFileDragStart = (
    e: DragEvent<HTMLDivElement>,
    doc: DocumentFile
  ) => {
    if (!doc.id) return;
    const ids = selectedFileIds.has(doc.id)
      ? Array.from(selectedFileIds)
      : [doc.id];
    e.dataTransfer.setData("application/json", JSON.stringify(ids));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleMoveClick = (targetFolder: string) => {
    if (!selectedFileIds.size) {
      toast({
        title: "Select files first",
        description: "Check the files you want to move.",
      });
      return;
    }
    moveFilesMutation.mutate({
      ids: Array.from(selectedFileIds),
      targetFolder,
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsDropping(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
    if (!isAdmin || !selectedFolder) return;

    const files = Array.from(e.dataTransfer.files);
    if (!files.length) {
      toast({
        title: "No files detected",
        description: "Please drop files to upload.",
        variant: "destructive",
      });
      return;
    }
    uploadFilesMutation.mutate(files);
  };

  const isUploadingToFolder = uploadFilesMutation.isPending;

  return (
    <div className="h-auto flex flex-col space-y-4 relative">
      {/* Header + Create Folder */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-display font-semibold">
            Documents Management
          </h2>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground mt-1">
              View only – only admins can upload or delete files.
            </p>
          )}
        </div>

        {isAdmin && (
          <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Folder</DialogTitle>
                <DialogDescription className="sr-only">
                  Create a new folder to organize your files
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Folder name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Financial, Minutes, Contracts"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Folder description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Short description for this folder"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={createFolderMutation.isPending}
                >
                  {createFolderMutation.isPending && (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {createFolderMutation.isPending
                    ? "Creating..."
                    : "Create Folder"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Rename / edit folder dialog (shared across all folder cards) */}
      <Dialog
        open={renamingFolder !== null}
        onOpenChange={(open) => !open && setRenamingFolder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
            <DialogDescription className="sr-only">
              Rename this folder or update its description
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4">
            <div>
              <Label htmlFor="rename_name">Folder name</Label>
              <Input
                key={`name-${renamingFolder}`}
                id="rename_name"
                name="name"
                defaultValue={renamingFolder || ""}
                required
              />
            </div>
            <div>
              <Label htmlFor="rename_description">Folder description</Label>
              <Input
                key={`desc-${renamingFolder}`}
                id="rename_description"
                name="description"
                defaultValue={
                  folders.find((f) => f.name === renamingFolder)?.description ||
                  ""
                }
                placeholder="Short description for this folder"
              />
            </div>
            <Button
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={renameFolderMutation.isPending}
            >
              {renameFolderMutation.isPending && (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {renameFolderMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete folder confirmation (shared across all folder cards) */}
      <AlertDialog
        open={deletingFolder !== null}
        onOpenChange={(open) => !open && setDeletingFolder(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete folder "{deletingFolder}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the folder and all files inside it.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deletingFolder && deleteFolderMutation.mutate(deletingFolder)
              }
              disabled={deleteFolderMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete file confirmation (shared across all rows, opened from the row's "..." menu) */}
      <AlertDialog
        open={deletingFileId !== null}
        onOpenChange={(open) => !open && setDeletingFileId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              This file will be permanently removed from the folder. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingFileId) {
                  deleteDocumentMutation.mutate(deletingFileId);
                }
                setDeletingFileId(null);
              }}
              disabled={deleteDocumentMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Folders list */}
      <div className="flex-1 flex flex-col">
        {isLoading && !dbDocuments ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : !folders.length ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8 border-2 border-dashed rounded-lg w-full">
              <p className="text-muted-foreground">No folders yet</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <Dialog
                key={folder.name}
                open={selectedFolder === folder.name}
                onOpenChange={(open) => openFolder(open ? folder.name : null)}
              >
                <DialogTrigger asChild>
                  <button className="group text-left rounded-lg overflow-hidden border bg-card hover:shadow-lg transition flex flex-col h-full p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <FolderOpen className="w-6 h-6 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold break-words">
                          {folder.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {folder.count} file{folder.count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    {folder.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {folder.description}
                      </p>
                    )}
                  </button>
                </DialogTrigger>

                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <DialogTitle>{folder.name}</DialogTitle>
                      {folder.description ? (
                        <DialogDescription>
                          {folder.description}
                        </DialogDescription>
                      ) : (
                        <DialogDescription>
                          {folder.count} file{folder.count !== 1 ? "s" : ""} in
                          this folder.
                        </DialogDescription>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileInputChange}
                          />

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                title="Folder options"
                                disabled={isUploadingToFolder}
                              >
                                {isUploadingToFolder ? (
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                                ) : (
                                  <MoreVertical className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => fileInputRef.current?.click()}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add files
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => setRenamingFolder(folder.name)}
                              >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => setDeletingFolder(folder.name)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete folder
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </DialogHeader>

                  <div
                    className={`mt-4 rounded-lg border border-dashed ${
                      isDropping ? "border-primary bg-primary/5" : "border-muted"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setSelectedFileIds(new Set());
                      }
                    }}
                  >
                    {isAdmin && selectedFileIds.size === 0 && (
                      <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground border-b bg-muted/40">
                        <UploadCloud className="w-4 h-4" />
                        <span>
                          Drag &amp; drop files here to add them to this
                          folder.
                        </span>
                      </div>
                    )}

                    {isAdmin && selectedFileIds.size > 0 && (
                      <div className="m-2 space-y-2 border rounded-md p-2 bg-muted/30">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              title="Clear selection"
                              onClick={() => setSelectedFileIds(new Set())}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              {selectedFileIds.size} selected
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="Download"
                              onClick={handleBulkDownload}
                            >
                              <Download className="w-4 h-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  title="Move"
                                  disabled={folders.length <= 1}
                                >
                                  <FolderOpen className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {folders
                                  .filter((f) => f.name !== folder.name)
                                  .map((target) => (
                                    <DropdownMenuItem
                                      key={target.name}
                                      onSelect={() =>
                                        handleMoveClick(target.name)
                                      }
                                    >
                                      {target.name}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  title="Delete"
                                  disabled={deleteSelectedMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete {selectedFileIds.size} file
                                    {selectedFileIds.size !== 1 ? "s" : ""}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() =>
                                      deleteSelectedMutation.mutate(
                                        Array.from(selectedFileIds)
                                      )
                                    }
                                    disabled={deleteSelectedMutation.isPending}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-2">
                      {filesInSelectedFolder.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">
                          No files in this folder yet.
                        </p>
                      ) : (
                      <>
                          <div className="divide-y">
                            {pagedFiles.map((doc, index) => (
                              <div
                                key={doc.id}
                                draggable={isAdmin}
                                onDragStart={(e) =>
                                  handleFileDragStart(e, doc)
                                }
                                onClick={(e) => handleFileClick(e, doc, index)}
                                onDoubleClick={() =>
                                  handleFileDoubleClick(doc)
                                }
                                className={`flex items-center gap-3 py-2 px-1 rounded-md transition-colors select-none ${
                                  isAdmin
                                    ? "cursor-pointer active:cursor-grabbing"
                                    : ""
                                } ${
                                  doc.id && selectedFileIds.has(doc.id)
                                    ? "bg-primary/10"
                                    : "hover:bg-muted/40"
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="text-sm font-medium break-words"
                                    title={doc.file_name}
                                  >
                                    {doc.file_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.file_type.toUpperCase()} •{" "}
                                    {formatFileSize(doc.file_size)}
                                  </p>
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      draggable={false}
                                      onPointerDown={(e) => {
                                        e.stopPropagation();
                                        if (doc.id) {
                                          setSelectedFileIds(new Set([doc.id]));
                                          setLastSelectedId(doc.id);
                                        }
                                      }}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors shrink-0"
                                      title="File options"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <a
                                        href={doc.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={doc.file_name}
                                        className="cursor-pointer"
                                      >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download
                                      </a>
                                    </DropdownMenuItem>

                                    {isAdmin && (
                                      <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>
                                          <FolderOpen className="w-4 h-4 mr-2" />
                                          Move
                                        </DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                          {folders
                                            .filter(
                                              (f) => f.name !== folder.name
                                            )
                                            .map((target) => (
                                              <DropdownMenuItem
                                                key={target.name}
                                                onSelect={() =>
                                                  doc.id &&
                                                  moveFilesMutation.mutate({
                                                    ids: [doc.id],
                                                    targetFolder: target.name,
                                                  })
                                                }
                                              >
                                                {target.name}
                                              </DropdownMenuItem>
                                            ))}
                                          {folders.length <= 1 && (
                                            <DropdownMenuItem disabled>
                                              No other folders yet
                                            </DropdownMenuItem>
                                          )}
                                        </DropdownMenuSubContent>
                                      </DropdownMenuSub>
                                    )}

                                    {isAdmin && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onSelect={() =>
                                            doc.id && setDeletingFileId(doc.id)
                                          }
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            ))}
                          </div>

                          {totalFilePages > 1 && (
                            <div className="flex items-center justify-between pt-3 px-1">
                              <p className="text-xs text-muted-foreground">
                                Page {filePage} of {totalFilePages}
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setFilePage((p) => Math.max(1, p - 1))
                                  }
                                  disabled={filePage <= 1}
                                >
                                  Previous
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setFilePage((p) =>
                                      Math.min(totalFilePages, p + 1)
                                    )
                                  }
                                  disabled={filePage >= totalFilePages}
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}