"use client"

import { useState, useRef } from "react"
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [converting, setConverting] = useState(false)
  const [converted, setConverted] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    dragRef.current?.classList.add("border-blue-500", "bg-blue-50")
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragRef.current?.classList.remove("border-blue-500", "bg-blue-50")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragRef.current?.classList.remove("border-blue-500", "bg-blue-50")

    const files = e.dataTransfer.files
    if (files.length > 0) handleFile(files[0])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) handleFile(files[0])
  }

  const handleFile = (selectedFile: File) => {
    if (
      selectedFile.type === "image/tiff" ||
      selectedFile.name.toLowerCase().endsWith(".tiff") ||
      selectedFile.name.toLowerCase().endsWith(".tif")
    ) {
      setFile(selectedFile)
      setError(null)
      setConverted(null)
      setPreview(null)
    } else {
      setError("Please upload a TIFF image file")
    }
  }

  const convertImage = async () => {
    if (!file) return

    setConverting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const response = await fetch("http://localhost:5000/convert", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to convert image")
      }

      const result = await response.json() // receive { filename, data }
      const jpgBase64 = result.data

      // Preview
      setPreview(`data:image/jpeg;base64,${jpgBase64}`)

      // Convert Base64 to Blob for download
      const byteCharacters = atob(jpgBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const jpgBlob = new Blob([byteArray], { type: "image/jpeg" })
      setConverted(jpgBlob)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred during conversion."
      if (errorMsg.includes("Failed to fetch")) {
        setError("Cannot connect to the conversion server. Make sure http://localhost:5000 is running.")
      } else {
        setError(errorMsg)
      }
    } finally {
      setConverting(false)
    }
  }

  const downloadImage = () => {
    if (!converted || !file) return

    const url = URL.createObjectURL(converted)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name.replace(/\.(tiff?|tif)$/i, ".jpg")
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const reset = () => {
    setFile(null)
    setConverted(null)
    setError(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">TIFF to JPG Converter</h1>
          <p className="text-slate-600">Convert your TIFF images to JPG format instantly</p>
        </div>

        <Card className="p-8 shadow-lg">
          {!file ? (
            <div
              ref={dragRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50"
            >
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Drag and drop your TIFF file</h2>
              <p className="text-slate-600 mb-4">or click to browse</p>
              <p className="text-sm text-slate-500">Supported formats: TIFF, TIF</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".tiff,.tif,image/tiff"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">Selected file:</p>
                <p className="font-semibold text-slate-900">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>

              {preview && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm text-slate-600 mb-3">Preview:</p>
                  <img
                    src={preview}
                    alt="Converted preview"
                    className="w-full rounded max-h-96 object-contain"
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {converted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-green-700">Image converted successfully!</p>
                </div>
              )}

              <div className="flex gap-3">
                {!converted ? (
                  <>
                    <Button
                      onClick={convertImage}
                      disabled={converting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {converting ? "Converting..." : "Convert to JPG"}
                    </Button>
                    <Button onClick={reset} variant="outline" className="flex-1 bg-transparent">
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={downloadImage} className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2">
                      <Download className="w-4 h-4" />
                      Download JPG
                    </Button>
                    <Button onClick={reset} variant="outline" className="flex-1 bg-transparent">
                      Convert Another
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </Card>

        <div className="text-center mt-8 text-slate-600 text-sm">
          <p>Your files are processed on our secure server for optimal conversion quality.</p>
        </div>
      </div>
    </main>
  )
}
