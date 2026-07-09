import { DiscussionsService } from './discussions.service';
import { CreateDiscussionDto, CreateReplyDto, UpdateDiscussionDto } from './dto';
export declare class DiscussionsController {
    private readonly discussionsService;
    constructor(discussionsService: DiscussionsService);
    getDiscussionsBySpace(spaceId: string, page: number, limit: number, pinned?: string): Promise<{
        discussions: ({
            _count: {
                replies: number;
            };
            author: {
                id: string;
                username: string | null;
                fullName: string | null;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            spaceId: string;
            content: string;
            isPinned: boolean;
            isLocked: boolean;
            authorId: string;
            isDeleted: boolean;
            viewCount: number;
            replyCount: number;
            lastActivityAt: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getDiscussionById(id: string): Promise<{
        space: {
            id: string;
            name: string;
            slug: string;
        };
        author: {
            id: string;
            username: string | null;
            fullName: string | null;
            avatarUrl: string | null;
        };
        replies: ({
            author: {
                id: string;
                username: string | null;
                fullName: string | null;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            content: string;
            discussionId: string;
            authorId: string;
            isDeleted: boolean;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        spaceId: string;
        content: string;
        isPinned: boolean;
        isLocked: boolean;
        authorId: string;
        isDeleted: boolean;
        viewCount: number;
        replyCount: number;
        lastActivityAt: Date;
    }>;
    createDiscussion(dto: CreateDiscussionDto, req: any): Promise<{
        author: {
            id: string;
            username: string | null;
            fullName: string | null;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        spaceId: string;
        content: string;
        isPinned: boolean;
        isLocked: boolean;
        authorId: string;
        isDeleted: boolean;
        viewCount: number;
        replyCount: number;
        lastActivityAt: Date;
    }>;
    updateDiscussion(id: string, dto: UpdateDiscussionDto, req: any): Promise<{
        author: {
            id: string;
            username: string | null;
            fullName: string | null;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        spaceId: string;
        content: string;
        isPinned: boolean;
        isLocked: boolean;
        authorId: string;
        isDeleted: boolean;
        viewCount: number;
        replyCount: number;
        lastActivityAt: Date;
    }>;
    deleteDiscussion(id: string, req: any): Promise<{
        message: string;
    }>;
    togglePin(id: string, isPinned: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        spaceId: string;
        content: string;
        isPinned: boolean;
        isLocked: boolean;
        authorId: string;
        isDeleted: boolean;
        viewCount: number;
        replyCount: number;
        lastActivityAt: Date;
    }>;
    toggleLock(id: string, isLocked: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        spaceId: string;
        content: string;
        isPinned: boolean;
        isLocked: boolean;
        authorId: string;
        isDeleted: boolean;
        viewCount: number;
        replyCount: number;
        lastActivityAt: Date;
    }>;
    createReply(dto: CreateReplyDto, req: any): Promise<{
        author: {
            id: string;
            username: string | null;
            fullName: string | null;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        discussionId: string;
        authorId: string;
        isDeleted: boolean;
    }>;
    deleteReply(id: string, req: any): Promise<{
        message: string;
    }>;
}
