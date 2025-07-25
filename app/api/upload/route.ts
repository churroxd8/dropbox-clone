import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest){
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        // Parse request body
        const body = await request.json()
        const {imagekit, userId: bodyUserId} = body

        // Verify the user is uploading to their own account
        if(bodyUserId ! == userId){
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401}
            );
        }

        // Validate ImageKit response
        if(!imagekit || !imagekit.url){
            return NextResponse.json(
                { error: "Invalid file upload data" },
                { status: 400 }
            )
        }

        // Extract file information from ImageKit response
        const fileData = {
            name: imagekit.name || "Untitled",
            path: imagekit.filePath || `/dropbox-clone/${userId}/${imagekit.name}`,
            size: imagekit.size || 0,
            type: imagekit.fileType || "image",
            fileUrl: imagekit.url,
            thumbnailUrl: imagekit.thumbnailUrl || null,
            userId: userId,
            parentId: null, // Root level by default
            isFolder: false,
            isStarred: false,
            isTrash: false,
        };

        // Insert file record into database
        const [newFile] = await db.insert(files).values(fileData).returning()

        return NextResponse.json(newFile)
    } catch (error) {
        console.error("Error saving file:", error)
        return NextResponse.json(
            { error: "Failed to save your file" },
            { status: 500 }
        );
    }
}