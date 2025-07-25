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
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized!" },
                { status: 401 }
            );
        }

        const { fileId } = await props.params;

        if (!fileId) {
            return NextResponse.json(
                { error: "A File ID is required!" },
                { status: 400 }
            );
        }

        // Time to delete the file
        const [file] = await db
            .select()
            .from(files)
            .where(
                and(
                    eq(files.id, fileId),
                    eq(files.userId, userId)
                )
            );

        if(!file) {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // Delete the file from ImageKit in case that is not a folder
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

                        if (
                            searchResults &&
                            searchResults.length > 0 &&
                            "fileId" in searchResults[0]
                        ) {
                            await imagekit.deleteFile((searchResults[0] as { fileId: string }).fileId);
                        } else {
                            await imagekit.deleteFile(imagekitFileId);
                        }
                    } catch (searchError) {
                        console.error(`Error searching for file in Imagekit:`, searchError);
                        await imagekit.deleteFile(imagekitFileId);
                    }
                }
            } catch (error) {
                console.error(`Error deleting file ${fileId} from ImageKit:`, error);
            }
        }

        // Delete the file from the database
        const [deletedFile] = await db
            .delete(files)
            .where(and(
                eq(files.id, fileId),
                eq(files.userId, userId)
            ))
            .returning()

        return NextResponse.json({
            sucess: true,
            messgage: "File deleted successfully",
            deletedFile,
        });

    } catch (error) {
        console.error("There was an error while deleting you file:", error);
        return NextResponse.json(
            { error: "An unexpected error happened while deleting your file" },
            { status: 500 }
        );
    }
}