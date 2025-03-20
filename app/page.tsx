"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, CheckCircle, AlertCircle, Download, FileUp, RefreshCw } from "lucide-react"
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
  const [processedFileData, setProcessedFileData] = useState<string | null>(null)
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
        setError("Upload venligst et Word dokument (.doc eller .docx)")
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
        setError("Upload venligst et Word dokument (.doc eller .docx)")
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
      
      // Store the base64 data and filename
      setProcessedFileData(result.file);
      const newFilename = result.filename || `processed_${result.debug.originalFilename}`;
      console.log('Setting filename to:', newFilename);
      setProcessedFileName(newFilename);
      
      setIsProcessing(false)
      setIsComplete(true)
    } catch (err) {
      setIsUploading(false)
      setIsProcessing(false)
      setProgress(0)
      setError(err instanceof Error ? err.message : "An error occurred during upload")
    }
  }

  const handleDownload = async () => {
    if (!processedFileData || !processedFileName) return;

    try {
      const response = await fetch("/api/download-processed-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData: processedFileData,
          fileName: processedFileName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to download file");
      }

      // Get the blob from the response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = processedFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to download file");
    }
  };

  const resetForm = () => {
    setFile(null)
    setIsUploading(false)
    setIsProcessing(false)
    setIsComplete(false)
    setError(null)
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {isComplete ? (
          <div className="text-center">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-8 flex flex-col items-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-emerald-500" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-md">
                    <div className="bg-emerald-500 rounded-full p-1">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-2 dark:text-white">Behandling fuldført!</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8">
                  Din fil er blevet behandlet og er klar til download.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <Button
                    className="flex-1 py-6 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20"
                    onClick={handleDownload}
                  >
                    <Download className="h-5 w-5" />
                    <span className="font-medium">Download Fil</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="flex-1 py-6 gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20"
                    onClick={resetForm}
                  >
                    <RefreshCw className="h-5 w-5" />
                    <span className="font-medium">Behandl ny fil</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="flex justify-center mt-8 gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
              <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
              <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
            </div>
          </div>
        ) : (
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white">
                <h1 className="text-2xl font-bold mb-1">Grammatikretter</h1>
                <p className="opacity-90">Upload dit Word dokument for automatisk behandling</p>
              </div>

              <div className="p-6">
                <div
                  className={`border-2 rounded-xl p-8 text-center transition-all ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10"
                      : "border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {!file ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <FileUp className="h-10 w-10 text-slate-500 dark:text-slate-400" />
                        </div>
                      </div>
                      <div>
                        <p className="text-lg font-medium dark:text-white">Træk og slip dit Word dokument her</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">eller klik for at browse filer</p>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        Vælg fil
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
                        <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <FileText className="h-10 w-10 text-emerald-500" />
                        </div>
                      </div>
                      <div>
                        <p className="text-lg font-medium break-all dark:text-white">{file.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <div className="flex justify-center gap-3">
                        <Button
                          variant="outline"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={resetForm}
                        >
                          Skift fil
                        </Button>
                        <Button
                          variant="outline"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white"
                          onClick={handleSubmit}
                          disabled={isUploading || isProcessing}
                        >
                          Behandl fil
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {isUploading && (
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Uploader...</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-slate-200 dark:bg-slate-700">
                      <div className="h-full bg-emerald-500 rounded-full"></div>
                    </Progress>
                  </div>
                )}

                {isProcessing && (
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium dark:text-white">Behandler dit dokument</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Dette kan tage et øjeblik...</p>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800/50 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {!isComplete && processedFileData && (
                  <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          Tidligere fil blev behandlet
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

