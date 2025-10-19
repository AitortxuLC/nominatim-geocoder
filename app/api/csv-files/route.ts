import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const dataDirectory = join(process.cwd(), 'public', 'data')
    const files = await readdir(dataDirectory)

    // Filter only CSV files
    const csvFiles = files.filter(file => file.endsWith('.csv'))

    return NextResponse.json({ files: csvFiles })
  } catch (error) {
    console.error('Error reading CSV files:', error)
    return NextResponse.json(
      { error: 'Failed to read CSV files' },
      { status: 500 }
    )
  }
}
