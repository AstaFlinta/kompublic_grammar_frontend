import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Send the file to the FastAPI backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);  // 'file' is the field name the backend expects

    const backendResponse = await fetch(`http://localhost:8000/upload/`, {
        method: "POST",
        body: backendFormData,
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText}`);
    }

    // Get the file blob from the response
    const processedFileBlob = await backendResponse.blob();
    
    // Convert blob to base64
    const fileArrayBuffer = await processedFileBlob.arrayBuffer();
    const fileBase64 = Buffer.from(fileArrayBuffer).toString('base64');
    
    // Create a processed filename from the original filename
    const originalFilename = file.name;
    const fileExtension = originalFilename.split('.').pop() || 'docx';
    const baseFilename = originalFilename.replace(/\.[^/.]+$/, ""); // Remove extension
    const processedFilename = `processed_${baseFilename}.${fileExtension}`;

    // Log filename information
    console.log('Original filename:', originalFilename);
    console.log('Generated processed filename:', processedFilename);
    
    // Create a response with both the file and debug info
    return NextResponse.json({
      file: fileBase64, // Send base64 encoded file
      isBase64: true, // Flag to indicate base64 encoding
      filename: processedFilename,
      debug: {
        originalFilename: file.name
      }
    });
  } catch (error) {
    console.error("Error processing file:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process file" },
      { status: 500 }
    )
  }
}

