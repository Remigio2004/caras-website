import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import joinImg from "../../assets/Recruitment.png";
import { TermsPrivacyModal } from "@/components/site/TermsPrivacyModal";

function isValidPhone(phone = "") {
  return /^[0-9\-\+\(\) ]{7,}$/.test(phone.trim());
}

// helper to compute age from date string "YYYY-MM-DD"
function getAgeFromBirthdate(birthdate: string): number {
  if (!birthdate) return 0;
  const today = new Date();
  const dob = new Date(birthdate);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export default function JoinUs() {
  const [loading, setLoading] = useState(false);
  const [under18, setUnder18] = useState(false);
  const [age, setAge] = useState<number | "">("");
  const [childAge, setChildAge] = useState<number | "">("");
  const [showTerms, setShowTerms] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    // explicit consent guard
    if (!consentChecked) {
      toast({
        title: "Consent Required",
        description:
          "Please read the privacy notice and tick the box to proceed.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const data = new FormData(e.currentTarget);
    const payload = Object.fromEntries(data.entries());

    // override age fields with computed state
    if (!under18) {
      payload.age = age === "" ? "" : String(age);
    } else {
      payload["child-age"] = childAge === "" ? "" : String(childAge);
    }

    // --- VALIDATION ---
    if (!under18) {
      if (String(payload.name || "").trim().length < 2) {
        toast({
          title: "Invalid Name",
          description: "Enter your name.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (!payload.birthday || String(payload.birthday).length < 8) {
        toast({
          title: "Birthday Required",
          description: "Please specify your birthday.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (isNaN(Number(payload.age)) || Number(payload.age) < 7) {
        toast({
          title: "Invalid Age",
          description: "Applicants must be age 7 or above.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (String(payload.address || "").trim().length < 3) {
        toast({
          title: "Invalid Address",
          description: "Enter your address.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (!isValidPhone(String(payload.contact || ""))) {
        toast({
          title: "Invalid Contact",
          description: "Enter a valid phone number.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (!String(payload.guardian || "").trim()) {
        toast({
          title: "Guardian Name Required",
          description: "Please provide your guardian's name.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (!String(payload["fb-acc"] || "").trim()) {
        toast({
          title: "Facebook Account Required",
          description: "Please enter your FB account.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    } else {
      if (String(payload["child-name"] || "").trim().length < 2) {
        toast({
          title: "Invalid Child Name",
          description: "Enter your child's name.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (!payload.birthday || String(payload.birthday).length < 8) {
        toast({
          title: "Birthday Required",
          description: "Please specify your child's birthday.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (
        isNaN(Number(payload["child-age"])) ||
        Number(payload["child-age"]) < 1
      ) {
        toast({
          title: "Invalid Child Age",
          description: "Child's age must be 1 or above.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (String(payload.address || "").trim().length < 3) {
        toast({
          title: "Invalid Address",
          description: "Enter your address.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (String(payload["parent-name"] || "").trim().length < 2) {
        toast({
          title: "Invalid Parent Name",
          description: "Enter parent's name.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (!isValidPhone(String(payload["parent-phone"] || ""))) {
        toast({
          title: "Invalid Parent Phone",
          description: "Enter a valid phone number.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (!String(payload.guardian || "").trim()) {
        toast({
          title: "Guardian Name Required",
          description: "Please provide the guardian's name.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      if (!String(payload["fb-acc"] || "").trim()) {
        toast({
          title: "Facebook Account Required",
          description: "Please enter FB account.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    let result;
    if (!under18) {
      result = await supabase.from("adult_applications").insert([
        {
          name: payload.name,
          birthday: payload.birthday,
          age: Number(payload.age),
          address: payload.address,
          contact: payload.contact,
          guardian: payload.guardian,
          fb_acc: payload["fb-acc"],
          message: payload.message || "",
        },
      ]);
    } else {
      result = await supabase.from("parent_applications").insert([
        {
          child_name: payload["child-name"],
          birthday: payload.birthday,
          child_age: Number(payload["child-age"]),
          address: payload.address,
          parent_name: payload["parent-name"],
          parent_phone: payload["parent-phone"],
          guardian: payload.guardian,
          fb_acc: payload["fb-acc"],
          message: payload.message || "",
        },
      ]);
    }

    if (result.error) {
      toast({
        title: "Submission Failed",
        description: result.error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    } else {
      toast({
        title: "Application Submitted",
        description: "Thank you! We will contact you soon.",
      });
      setLoading(false);
      setTimeout(() => {
        formRef.current?.reset();
        setUnder18(false);
        setAge("");
        setChildAge("");
        setConsentChecked(false);
      }, 800);
    }
  }

  return (
    <section id="join" className="py-20 bg-neutral-50 min-h-[100vh]">
      <div className="container mx-auto px-[4-rem] grid md:grid-cols-2 gap-10 items-center">
        <div className="relative order-1 md:order-2 block">
          <div className="rounded-lg overflow-hidden bg-gradient-emerald shadow-elegant">
            <img
              className="rounded-2xl px-2 py-2 w-full h-auto object-cover"
              src={joinImg}
              alt="join-us-photo"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 w-40 h-40 rounded-full bg-gradient-altar opacity-80 shadow-glow hidden md:block" />
        </div>

        <div className="order-2 md:order-1">
          <h2 className="text-3xl md:text-4xl font-display">Join Us</h2>
          <p className="mt-2 text-muted-foreground max-w-xl text-justify">
            {under18
              ? "This form is for applicants under 18 and requires a parent or guardian to fill out the information."
              : "Fill out the form below. Applicants should be committed to formation and regular attendance."}
          </p>

          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="mt-6 grid gap-4 max-w-xl"
          >
            {!under18 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Name</label>
                    <Input name="name" required />
                  </div>
                  <div>
                    <label className="text-sm">Birthday</label>
                    <Input
                      name="birthday"
                      type="date"
                      required
                      onChange={(e) => {
                        const value = e.target.value;
                        const computedAge = getAgeFromBirthdate(value);
                        setAge(isNaN(computedAge) ? "" : computedAge);
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Age</label>
                    <Input
                      name="age"
                      type="number"
                      min={7}
                      required
                      value={age}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm">Guardian's Name</label>
                    <Input name="guardian" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm">Address</label>
                  <Input name="address" required />
                </div>
                <div>
                  <label className="text-sm">Contact</label>
                  <Input name="contact" type="tel" required />
                </div>
                <div>
                  <label className="text-sm">Facebook Account</label>
                  <Input name="fb-acc" required />
                </div>
                <div>
                  <label className="text-sm">Short Message</label>
                  <Textarea name="message" rows={3} />
                </div>
              </>
            )}

            {under18 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Child’s Name</label>
                    <Input name="child-name" required />
                  </div>
                  <div>
                    <label className="text-sm">Birthday</label>
                    <Input
                      name="birthday"
                      type="date"
                      required
                      onChange={(e) => {
                        const value = e.target.value;
                        const computedAge = getAgeFromBirthdate(value);
                        setChildAge(isNaN(computedAge) ? "" : computedAge);
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Child’s Age</label>
                    <Input
                      name="child-age"
                      type="number"
                      min={1}
                      required
                      value={childAge}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm">Guardian's Name</label>
                    <Input name="guardian" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm">Address</label>
                  <Input name="address" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Parent’s Name</label>
                    <Input name="parent-name" required />
                  </div>
                  <div>
                    <label className="text-sm">Parent’s Phone #</label>
                    <Input name="parent-phone" type="tel" required />
                  </div>
                </div>
                <div>
                  <label className="text-sm">Facebook Account</label>
                  <Input name="fb-acc" required />
                </div>
                <div>
                  <label className="text-sm">Short Message</label>
                  <Textarea name="message" rows={3} />
                </div>
              </>
            )}

            {/* Consent + View Terms */}
            <div className="flex flex-col gap-2 pt-2 text-sm">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="privacy-consent"
                  required
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 border-emerald-400 text-emerald-700"
                />
                <span className="text-muted-foreground">
                  I have read and agree to the Terms & Conditions and Privacy
                  Notice of CARAS de San Sebastian, and I consent to the
                  collection and processing of my/our personal data for altar
                  server recruitment and ministry coordination.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="self-start text-xs font-medium text-emerald-800 hover:text-emerald-900 underline underline-offset-4"
              >
                View Terms & Privacy
              </button>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" variant="gold" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUnder18(!under18);
                  setAge("");
                  setChildAge("");
                }}
              >
                {under18 ? "18 and Above Form" : "Under 18?"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <TermsPrivacyModal open={showTerms} onOpenChange={setShowTerms} />
    </section>
  );
}
