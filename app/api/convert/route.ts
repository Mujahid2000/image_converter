import { type NextRequest, NextResponse } from "next/server"
import Jimp from "jimp"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Conversion request received")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log("[v0] No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] File received:", file.name, "Type:", file.type, "Size:", file.size)

    // Validate file type
    if (
      file.type !== "image/tiff" &&
      !file.name.toLowerCase().endsWith(".tiff") &&
      !file.name.toLowerCase().endsWith(".tif")
    ) {
      console.log("[v0] Invalid file type")
      return NextResponse.json({ error: "Invalid file type. Please upload a TIFF image." }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer()
    console.log("[v0] Buffer created, size:", buffer.byteLength)

    try {
      const image = await Jimp.read(Buffer.from(buffer))
      console.log("[v0] Image loaded successfully")

      // Convert to JPEG with quality 95
      const jpgBuffer = await image.quality(95).toBuffer({ format: "image/jpeg" })
      console.log("[v0] Conversion successful, JPG size:", jpgBuffer.length)

      // Return the converted image
      return new NextResponse(jpgBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/jpeg",
          "Content-Disposition": `attachment; filename="${file.name.replace(/\.(tiff?|tif)$/i, ".jpg")}"`,
        },
      })
    } catch (conversionError) {
      console.error("[v0] Conversion error:", conversionError)
      throw new Error(
        `Image processing failed: ${conversionError instanceof Error ? conversionError.message : "Unknown error"}`,
      )
    }
  } catch (error) {
    console.error("[v0] API error:", error)
    const errorMessage =
      error instanceof Error ? error.message : "Failed to convert image. Please ensure it is a valid TIFF file."
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
