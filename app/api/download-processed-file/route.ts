import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { fileData, fileName } = await request.json()

    if (!fileData || !fileName) {
      return NextResponse.json(
        { error: "Missing file data or filename" },
        { status: 400 }
      )
    }

    // Convert base64 to binary
    const binaryString = atob(fileData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Create response with the file
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("Error processing file download:", error)
    return NextResponse.json(
      { error: "Failed to process file download" },
      { status: 500 }
    )
  }
}
