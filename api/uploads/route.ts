
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Mock file upload - in real app would upload to S3 or cloud storage
    const fileId = Math.random().toString(36).substr(2, 9);
    const fileName = `${Date.now()}-${file.name}`;
    const fileUrl = `/uploads/${fileName}`;

    const uploadedFile = {
      id: fileId,
      originalName: file.name,
      fileName: fileName,
      fileSize: file.size,
      mimeType: file.type,
      url: fileUrl,
      uploadedBy: session.user.id,
      uploadedAt: new Date().toISOString()
    };

    return NextResponse.json(uploadedFile, { status: 201 });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Mock uploaded files
    let files = [
      {
        id: '1',
        originalName: 'architecture-diagram.png',
        fileName: '1705401234567-architecture-diagram.png',
        fileSize: 2048576,
        mimeType: 'image/png',
        url: '/uploads/1705401234567-architecture-diagram.png',
        uploadedBy: session.user.id,
        uploadedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        originalName: 'api-documentation.pdf',
        fileName: '1705401234568-api-documentation.pdf',
        fileSize: 5242880,
        mimeType: 'application/pdf',
        url: '/uploads/1705401234568-api-documentation.pdf',
        uploadedBy: session.user.id,
        uploadedAt: '2024-01-15T09:15:00Z'
      }
    ];

    // Apply type filter
    if (type !== 'all') {
      if (type === 'images') {
        files = files.filter(f => f.mimeType.startsWith('image/'));
      } else if (type === 'documents') {
        files = files.filter(f => f.mimeType.includes('pdf') || f.mimeType.includes('document'));
      }
    }

    // Pagination
    const paginatedFiles = files.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginatedFiles,
      total: files.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Files fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
