"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, CheckCircle, AlertCircle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function WordFileProcessor() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processedFileUrl, setProcessedFileUrl] = useState<string | null>(null)
  const [processedFileName, setProcessedFileName] = useState<string>("processed-document.docx")
  const [progress, setProgress] = useState(0)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (
        droppedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        droppedFile.type === "application/msword"
      ) {
        setFile(droppedFile)
        setError(null)
      } else {
        setError("Please upload a Word document (.doc or .docx)")
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (
        selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        selectedFile.type === "application/msword"
      ) {
        setFile(selectedFile)
        setError(null)
      } else {
        setError("Please upload a Word document (.doc or .docx)")
      }
    }
  }

  const handleSubmit = async () => {
    if (!file) return

    setIsUploading(true)
    setProgress(0)
    setError(null)

    // Create FormData to send the file
    const formData = new FormData()
    formData.append("file", file)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      // Send to our Next.js API endpoint
      const response = await fetch("/api/process-word-file", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)
      setIsUploading(false)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status}`)
      }

      // Start processing phase
      setIsProcessing(true)

      const result = await response.json();
      
      // Log debug information
      console.log('Debug info:', result.debug);
      console.log('Filename from backend:', result.filename);
      console.log('Original filename:', result.debug.originalFilename);
      
      // Convert the base64 data back to a blob
      const binaryString = atob(result.file);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const processedFileBlob = new Blob([bytes], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      // Create a URL for the processed file
      const processedFileUrl = URL.createObjectURL(processedFileBlob);
      
      setIsProcessing(false)
      setIsComplete(true)
      setProcessedFileUrl(processedFileUrl)
      // Use the original filename with a prefix if available
      const newFilename = result.filename || `processed_${result.debug.originalFilename}`;
      console.log('Setting filename to:', newFilename);
      setProcessedFileName(newFilename)
    } catch (err) {
      setIsUploading(false)
      setIsProcessing(false)
      setProgress(0)
      setError(err instanceof Error ? err.message : "An error occurred during upload")
    }
  }

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = processedFileName; // Use the stored filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setFile(null)
    setIsUploading(false)
    setIsProcessing(false)
    setIsComplete(false)
    setError(null)
    setProgress(0)
    setProcessedFileName("processed-document.docx")
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Word File Processor</CardTitle>
          <CardDescription>Upload a Word document to process and fix it automatically</CardDescription>
        </CardHeader>
        <CardContent>
          {!isComplete ? (
            <div
              className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {!file ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Drag and drop your Word file here</p>
                    <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
                  </div>
                  <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                    Select File
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <FileText className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-lg font-medium break-all">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={resetForm}>
                      Change File
                    </Button>
                    <Button onClick={handleSubmit} disabled={isUploading || isProcessing}>
                      Process File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4 py-6">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <h3 className="text-xl font-medium">Processing Complete!</h3>
              <p className="text-muted-foreground">
                Your file has been processed successfully and is ready for download.
              </p>
            </div>
          )}

          {isUploading && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {isProcessing && (
            <div className="mt-6 space-y-2 text-center">
              <p className="text-muted-foreground">Processing your document...</p>
              <div className="flex justify-center mt-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}
          {!isComplete && processedFileUrl && (
            <div className="mt-6 p-4 bg-primary/10 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="text-sm font-medium">Previous file processed successfully</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleDownload(processedFileUrl || "")}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        {isComplete && processedFileUrl && (
          <CardFooter className="flex justify-center gap-4">
            <Button 
              className="gap-2" 
              onClick={() => handleDownload(processedFileUrl || "")}
            >
              <Download className="h-4 w-4" />
              Download Processed File
            </Button>
            <Button variant="outline" className="gap-2" onClick={resetForm}>
              <Upload className="h-4 w-4" />
              Process Another File
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

