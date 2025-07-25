import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import ImageKit from "imagekit";
import { NextRequest, NextResponse } from "next/server";

// ImageKit Credentials
const imagekit = new ImageKit({
    publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ fileId: string }> }
) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized!" },
                { status: 401 }
            );
        }

        const { fileId } = await props.params;

        if (!fileId) {
            return NextResponse.json(
                { error: "File ID is required!" },
                { status: 400 }
            );
        }

        // Getting the file to delete
        const [file] = await db
            .select()
            .from(files)
            .where(
                and(
                    eq(files.id, fileId),
                    eq(files.userId, userId)
                )
            );
        
        if (!file) {
            return NextResponse.json(
                { error: "File not found!" },
                { status: 404 }
            );
        }

        // Deleting the file from ImageKit if it's not a folder
        if (!file.isFolder) {
            try {
                let imagekitFileId = null;

                if (file.fileUrl) {
                    const urlWithoutQuery = file.fileUrl.split("?")[0];
                    imagekitFileId = urlWithoutQuery.split("/").pop();
                }

                if (!imagekitFileId && file.path) {
                    imagekitFileId = file.path.split("/").pop();
                }

                if (imagekitFileId) {
                    try {
                        const searchResults = await imagekit.listFiles({
                            name: imagekitFileId,
                            limit: 1,
                        });

                        if (searchResults && searchResults.length > 0) {
                            
                        }
                    } catch (error) {
                        
                    }
                }
            } catch (error) {
                
            }
        }
    } catch (error) {
        
    }
}