
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { trpc } from "@/lib/trpc";

export default function ImportRecipesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const importMutation = trpc.recipes.importFromZip.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Import Complete",
        description: `${data.imported} recipes have been imported.`,
      });
      setIsUploading(false);
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "No file selected",
        description: "Please select a zip file to upload.",
        variant: "destructive",
      });
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
      toast({
        title: "Upload Failed",
        description: "An error occurred while uploading the file.",
        variant: "destructive",
      });
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
