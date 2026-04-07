import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Image as ImageIcon,
  Loader2,
  Music,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { AudioFile, Genre } from "../backend";
import type { FileType } from "../backend";
import { useActorReady } from "../hooks/useActorReady";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMintNFT, useUploadAudioFile } from "../hooks/useQueries";
import { NFTMintDialog } from "./NFTMintDialog";

type GenreKey =
  | "pop"
  | "rock"
  | "jazz"
  | "hipHop"
  | "electronic"
  | "classical"
  | "spirit"
  | "other";

const GENRE_OPTIONS: { value: GenreKey; label: string }[] = [
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "jazz", label: "Jazz" },
  { value: "hipHop", label: "Hip-Hop" },
  { value: "electronic", label: "Electronic" },
  { value: "classical", label: "Classical" },
  { value: "spirit", label: "Spirit" },
  { value: "other", label: "Other" },
];

function genreKeyToValue(key: GenreKey, customLabel?: string): Genre {
  switch (key) {
    case "pop":
      return { __kind__: "pop", pop: null };
    case "rock":
      return { __kind__: "rock", rock: null };
    case "jazz":
      return { __kind__: "jazz", jazz: null };
    case "hipHop":
      return { __kind__: "hipHop", hipHop: null };
    case "electronic":
      return { __kind__: "electronic", electronic: null };
    case "classical":
      return { __kind__: "classical", classical: null };
    case "spirit":
      return { __kind__: "other", other: "Spirit" };
    case "other":
      return { __kind__: "other", other: customLabel || "Other" };
  }
}

export function AudioUploader() {
  const { identity } = useInternetIdentity();
  const { isActorReady, isActorInitializing } = useActorReady();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [creator, setCreator] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<GenreKey>("other");
  const [customGenreLabel, setCustomGenreLabel] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedAudioFile, setUploadedAudioFile] = useState<AudioFile | null>(
    null,
  );
  const [mintDialogOpen, setMintDialogOpen] = useState(false);

  const uploadMutation = useUploadAudioFile();
  const mintMutation = useMintNFT();

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetAudioFile(selectedFile);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetImageFile(selectedFile);
    }
  };

  const validateAndSetAudioFile = useCallback(
    (selectedFile: File) => {
      const validTypes = [
        "audio/mpeg",
        "audio/wav",
        "audio/mp4",
        "audio/m4a",
        "audio/ogg",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error(
          "Invalid file type. Please upload an audio file (MP3, WAV, M4A, OGG).",
        );
        return;
      }

      setAudioFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }

      const audio = new Audio();
      audio.src = URL.createObjectURL(selectedFile);
      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(audio.src);
      });
    },
    [title],
  );

  const validateAndSetImageFile = useCallback((selectedFile: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Invalid image type. Please upload a JPEG or PNG image.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large. Maximum size is 5MB.");
      return;
    }

    setImageFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);

      const audioFiles = files.filter((f) => f.type.startsWith("audio/"));
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));

      if (audioFiles.length > 0) {
        validateAndSetAudioFile(audioFiles[0]);
      }

      if (imageFiles.length > 0) {
        validateAndSetImageFile(imageFiles[0]);
      }
    },
    [validateAndSetAudioFile, validateAndSetImageFile],
  );

  const handleUpload = async () => {
    if (!audioFile || !title || !creator) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isActorReady) {
      toast.error(
        "System is initializing. Please wait a moment and try again.",
      );
      return;
    }

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const audio = new Audio();
      audio.src = URL.createObjectURL(audioFile);

      await new Promise<void>((resolve) => {
        audio.addEventListener("loadedmetadata", () => {
          URL.revokeObjectURL(audio.src);
          resolve();
        });
      });

      const duration = Math.floor(audio.duration);
      const size = audioFile.size;
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const genreValue: Genre = genreKeyToValue(
        selectedGenre,
        customGenreLabel,
      );

      let coverImageData: Uint8Array | undefined = undefined;
      if (imageFile) {
        const imageArrayBuffer = await imageFile.arrayBuffer();
        coverImageData = new Uint8Array(imageArrayBuffer);
      }

      await uploadMutation.mutateAsync({
        id,
        title,
        duration,
        size,
        audioData: uint8Array,
        creator,
        genre: genreValue,
        isPublic,
        coverImage: coverImageData,
        onProgress: (percentage) => {
          setUploadProgress(percentage);
        },
      });

      toast.success("Audio file uploaded successfully!");

      // Reset form
      setAudioFile(null);
      setImageFile(null);
      setImagePreview(null);
      setTitle("");
      setCreator("");
      setSelectedGenre("other");
      setCustomGenreLabel("");
      setIsPublic(true);
      setUploadProgress(0);
      setUploadedAudioFile(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload audio file");
    }
  };

  const handleMint = async (data: {
    title: string;
    description: string;
    artist: string;
    fileType: FileType;
    attachments?: any[];
  }) => {
    if (!uploadedAudioFile) return;

    await mintMutation.mutateAsync({
      audioFile: uploadedAudioFile,
      ...data,
    });

    setMintDialogOpen(false);
    setUploadedAudioFile(null);
  };

  // Only render if authenticated
  if (!isAuthenticated) {
    return null;
  }

  const showActorWarning = !isActorReady && !isActorInitializing;
  const isUploadDisabled =
    !audioFile ||
    !title ||
    !creator ||
    uploadMutation.isPending ||
    !isActorReady;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Upload Audio File
          </CardTitle>
          <CardDescription>
            Upload your audio files with album artwork. Supported formats: MP3,
            WAV, M4A, OGG (audio) | JPEG, PNG (images)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Actor Readiness Warning */}
          {isActorInitializing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Initializing system... Please wait a moment.
              </AlertDescription>
            </Alert>
          )}

          {showActorWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                System not ready. Please log in to upload files.
              </AlertDescription>
            </Alert>
          )}

          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            data-ocid="uploader.dropzone"
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag and drop your audio file and album artwork here, or click to
              browse
            </p>
            <div className="flex gap-2 justify-center">
              <Input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileChange}
                className="hidden"
                id="audio-file-upload"
                disabled={!isActorReady}
              />
              <Label htmlFor="audio-file-upload">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  asChild
                  disabled={!isActorReady}
                >
                  <span>
                    <Music className="mr-2 h-4 w-4" />
                    Choose Audio
                  </span>
                </Button>
              </Label>

              <Input
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageFileChange}
                className="hidden"
                id="image-file-upload"
                disabled={!isActorReady}
              />
              <Label htmlFor="image-file-upload">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  asChild
                  disabled={!isActorReady}
                >
                  <span>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Choose Image
                  </span>
                </Button>
              </Label>
            </div>

            <div className="mt-4 space-y-2">
              {audioFile && (
                <p className="text-sm font-medium flex items-center justify-center gap-2">
                  <Music className="h-4 w-4" />
                  {audioFile.name}
                </p>
              )}
              {imageFile && (
                <p className="text-sm font-medium flex items-center justify-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  {imageFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative w-32 h-32 mx-auto">
              <img
                src={imagePreview}
                alt="Album artwork preview"
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={removeImage}
                disabled={!isActorReady}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter audio title"
                disabled={!isActorReady}
                data-ocid="uploader.title.input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creator">Creator/Artist *</Label>
              <Input
                id="creator"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="Enter creator or artist name"
                disabled={!isActorReady}
                data-ocid="uploader.creator.input"
              />
            </div>

            {/* Genre Select */}
            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select
                value={selectedGenre}
                onValueChange={(v) => {
                  setSelectedGenre(v as GenreKey);
                  if (v !== "other") setCustomGenreLabel("");
                }}
                disabled={!isActorReady}
              >
                <SelectTrigger id="genre" data-ocid="uploader.genre.select">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {GENRE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Custom genre input — shown only when "Other" is selected */}
              {selectedGenre === "other" && (
                <div className="pt-1">
                  <Input
                    id="custom-genre"
                    value={customGenreLabel}
                    onChange={(e) => setCustomGenreLabel(e.target.value)}
                    placeholder="Enter your genre..."
                    disabled={!isActorReady}
                    data-ocid="uploader.genre.input"
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={!isActorReady}
                data-ocid="uploader.public.switch"
              />
              <Label htmlFor="public">Make this audio file public</Label>
            </div>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={isUploadDisabled}
            className="w-full"
            data-ocid="uploader.submit_button"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : !isActorReady ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                {isActorInitializing ? "Initializing..." : "Not Ready"}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Audio
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* NFT Mint Dialog */}
      {uploadedAudioFile && (
        <NFTMintDialog
          open={mintDialogOpen}
          onOpenChange={setMintDialogOpen}
          audioFile={uploadedAudioFile}
          onMint={handleMint}
          isLoading={mintMutation.isPending}
        />
      )}
    </>
  );
}
