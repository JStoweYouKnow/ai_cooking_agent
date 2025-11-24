
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function ImportRecipesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const importMutation = trpc.recipes.importFromZip.useMutation({
    onSuccess: (data) => {
      toast.success(`Import Complete: ${data.imported} recipes have been imported.`);
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Import Failed");
      setIsUploading(false);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast.error("No file selected. Please select a zip file to upload.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      importMutation.mutate({ path: result.path });
    } catch (error) {
      toast.error("An error occurred while uploading the file.");
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Import Recipes</h1>
      <p className="mb-8">
        Upload a zip file containing recipe JSON files to add them to your
        library.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="flex flex-col gap-4">
          <Input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload and Import"}
          </Button>
        </div>
      </form>
    </div>
  );
}
