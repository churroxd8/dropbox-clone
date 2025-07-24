import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest){
    try {
        
        // Checking for authentication
        const { userId } = await auth();
        
        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized!" },
                { status: 401 }
            );
        }

        // Query parameters
        const searchParams = request.nextUrl.searchParams;
        const queryUserId = searchParams.get("userId");
        const parentId = searchParams.get("parentId");

        // Checks if the user is requesting his own files
        if (!queryUserId || queryUserId !== userId) {
            return NextResponse.json(
                { error: "Unauthorized!" },
                { status: 401 }
            );
        }

        // Fetching files from the database based on parentId
        let userFiles
        
        if (parentId) {
            // Fetching from a specific folder
            userFiles = await db
                .select()
                .from(files)
                .where(
                    and(
                        eq(files.userId, userId),
                        eq(files.parentId, parentId)
                    )
                );
        } else {
            // Fetching root-level files (parentId is null)
            userFiles = await db
                .select()
                .from(files)
                .where(
                    and(
                        eq(files.userId, userId),
                        isNull(files.parentId)
                    )
                );
        }

        return NextResponse.json(userFiles);
    } catch (error) {
        console.error("Error fetching your files!:", error);
        return NextResponse.json(
            { error: "Failed to fetch files" },
            { status: 500 }
        );
    }
}