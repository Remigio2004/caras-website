import { useState, useMemo, DragEvent } from "react";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  UploadCloud,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileImage,
  Download,
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

function getFileIcon(fileType: string) {
  const type = fileType.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(type)) {
    return FileImage;
  }
  if (["xls", "xlsx", "csv"].includes(type)) {
    return FileSpreadsheet;
  }
  return FileText;
}

const BUCKET_FOLDER = "caras-documents";

export default function DocumentsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [filePage, setFilePage] = useState(1);
  const FILES_PER_PAGE = 6;
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Normal form upload (multi-file, from the "Create Folder / Add Files" dialog)
  const createDocumentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!isAdmin) throw new Error("Not authorized");

      const folder = (formData.get("folder") as string) || "General";
      const folder_description =
        (formData.get("folder_description") as string) || "";

      const files = formData.getAll("files") as File[];
      if (!files.length) throw new Error("No files provided");

      for (const file of files) {
        await uploadSingleDocument(file, folder, folder_description);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Files added successfully" });
      setIsDialogOpen(false);
    },
    onError: (err) => {
      console.error("createDocument error:", err);
      toast({
        title: "Upload failed",
        description: String(err),
        variant: "destructive",
      });
    },
  });

  // Drag & drop upload straight into the currently open folder
  const dropUploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!isAdmin) throw new Error("Not authorized");
      if (!selectedFolder) throw new Error("No folder selected");

      const existing = allDocuments.find(
        (doc) => (doc.folder || "General") === selectedFolder
      );
      const folder_description = existing?.folder_description || "";

      for (const file of files) {
        await uploadSingleDocument(file, selectedFolder, folder_description);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Files added to folder" });
    },
    onError: (err) => {
      console.error("drop upload error:", err);
      toast({
        title: "Upload failed",
        description: String(err),
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

  // Delete whole folder (all rows with that folder name)
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      if (!isAdmin) throw new Error("Not authorized");
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("folder", folderName);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Folder deleted" });
      setSelectedFolder(null);
    },
    onError: (err) => {
      console.error("delete folder error:", err);
      toast({
        title: "Delete failed",
        description: String(err),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) {
      toast({
        title: "Not allowed",
        description: "Only admins can upload files.",
        variant: "destructive",
      });
      return;
    }
    const formData = new FormData(e.currentTarget);
    createDocumentMutation.mutate(formData);
  };

  const allDocuments = useMemo(() => {
    const combined = dbDocuments || [];
    return combined.map((doc) => ({
      ...doc,
      folder: doc.folder || "General",
    })) as DocumentFile[];
  }, [dbDocuments]);

  const folders = useMemo(() => {
    const map = new Map<string, DocumentFile>();
    for (const doc of allDocuments) {
      const folderName = doc.folder || "General";
      if (!map.has(folderName)) {
        map.set(folderName, doc);
      }
    }
    return Array.from(map.entries()).map(([name, first]) => ({
      name,
      count: allDocuments.filter((d) => (d.folder || "General") === name)
        .length,
      description: first.folder_description || "",
    }));
  }, [allDocuments]);

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
    dropUploadMutation.mutate(files);
  };

  const isDropUploading = dropUploadMutation.isPending;

  return (
    <div className="h-auto flex flex-col space-y-4 relative">
      {/* Header + Add folder */}
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Files</DialogTitle>
                <DialogDescription className="sr-only">
                  Upload files to a folder
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="folder">Folder</Label>
                    <Input
                      id="folder"
                      name="folder"
                      placeholder="Folder name"
                      defaultValue={selectedFolder || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="folder_description">
                      Folder description
                    </Label>
                    <Input
                      id="folder_description"
                      name="folder_description"
                      placeholder="Short description for this folder"
                    />
                  </div>
                </div>

                <div>
                  <Label>Upload files</Label>
                  <div className="mt-1 grid gap-2">
                    <Input
                      id="files"
                      name="files"
                      type="file"
                      multiple
                      className="cursor-pointer file:cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      You can select multiple files at once. Any file type is
                      accepted.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={createDocumentMutation.isPending}
                >
                  {createDocumentMutation.isPending && (
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  )}
                  {createDocumentMutation.isPending
                    ? "Uploading..."
                    : "Add Files"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
                onOpenChange={(open) => {
                  setSelectedFolder(open ? folder.name : null);
                  setFilePage(1);
                }}
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
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedFolder(folder.name);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add files
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="destructive"
                                className="h-8 w-8"
                                title="Delete folder"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete folder "{folder.name}"?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove all files
                                  listed in this folder. This action cannot be
                                  undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() =>
                                    deleteFolderMutation.mutate(folder.name)
                                  }
                                  disabled={deleteFolderMutation.isPending}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
                  >
                    {isAdmin && (
                      <div className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground border-b bg-muted/40">
                        <UploadCloud className="w-4 h-4" />
                        <span>
                          Drag &amp; drop files here to add them to this
                          folder.
                        </span>
                      </div>
                    )}

                    <div className="p-2">
                      {isDropUploading ? (
                        <p className="text-sm text-muted-foreground p-2 flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                          Uploading files to this folder...
                        </p>
                      ) : filesInSelectedFolder.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">
                          No files in this folder yet.
                        </p>
                      ) : (
                        <>
                          <div className="divide-y">
                            {pagedFiles.map((doc) => {
                              const Icon = getFileIcon(doc.file_type);
                              return (
                                <div
                                  key={doc.id}
                                  className="flex items-start gap-3 py-2 px-1"
                                >
                                  <Icon className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
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
                                  <a
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={doc.file_name}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors shrink-0"
                                    title="Download"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                  {isAdmin && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <button
                                          type="button"
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-destructive/10 text-destructive transition-colors shrink-0"
                                          title="Delete file"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete this file?
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This file will be permanently
                                            removed from the folder. This
                                            action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            onClick={() =>
                                              doc.id &&
                                              deleteDocumentMutation.mutate(
                                                doc.id
                                              )
                                            }
                                            disabled={
                                              deleteDocumentMutation.isPending
                                            }
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </div>
                              );
                            })}
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