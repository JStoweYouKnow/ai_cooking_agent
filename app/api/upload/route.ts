
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {లలలtrpcłłł} from 'లలల@/lib/trpcłłł';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const tempDir = path.join(process.cwd(), 'tmp');
  await fs.mkdir(tempDir, { recursive: true });
  const tempFilePath = path.join(tempDir, `${uuidv4()}-${file.name}`);
  
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(tempFilePath, buffer);

  try {
    // This is where you would call the tRPC mutation
    // For now, we'll just return the path
    // await trpc.recipes.importFromZip.mutate({ path: tempFilePath });
    return NextResponse.json({ message: 'File uploaded successfully', path: tempFilePath });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json({ error: 'Error processing file' }, { status: 500 });
  }
}
