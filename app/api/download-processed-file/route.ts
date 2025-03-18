import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get the file URL from the query parameters
    const url = new URL(request.url)
    const fileUrl = url.searchParams.get("fileUrl")

    if (!fileUrl) {
      return NextResponse.json({ error: "No file URL provided" }, { status: 400 })
    }

    // Fetch the file from the FastAPI backend
    const response = await fetch(fileUrl)

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    // Get the file content as a blob
    const fileBlob = await response.blob()

    // Create response with appropriate headers for a Word document
    const downloadResponse = new NextResponse(fileBlob, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=processed-document.docx",
      },
    })

    return downloadResponse
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download processed file" },
      { status: 500 }
    )
  }
}

