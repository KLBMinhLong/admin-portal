import { Component, Input, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/auth/auth.service';
import { RequestCommentService, CommentDto } from '@core/services/request-comment.service';
import { WebsocketService } from '@core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-request-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
      <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="text-base font-semibold text-slate-900 flex items-center gap-2">
          <svg class="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          Trao đổi & Thảo luận
        </h3>
      </div>

      <!-- Messages thread -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        @for (msg of comments(); track msg.id) {
          @if (msg.isSystem) {
            <div class="flex justify-center my-4">
              <span class="px-3 py-1 bg-slate-200 text-slate-600 rounded-full text-xs font-medium">
                {{ msg.content }} ({{ msg.timestamp | date:'HH:mm dd/MM' }})
              </span>
            </div>
          } @else {
            <div class="flex gap-3" [class.flex-row-reverse]="isMe(msg.authorName || '')">
              <!-- Avatar -->
              <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
                   [ngClass]="isMe(msg.authorName || '') ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'">
                {{ (msg.authorName || '?').charAt(0).toUpperCase() }}
              </div>
              
              <!-- Message Bubble -->
              <div class="flex flex-col max-w-[80%]" [class.items-end]="isMe(msg.authorName || '')">
                <div class="flex items-center gap-2 mb-1" [class.flex-row-reverse]="isMe(msg.authorName || '')">
                  <span class="text-xs font-medium text-slate-900">{{ msg.authorName }}</span>
                  <span class="text-[10px] text-slate-500">{{ msg.authorRole }} • {{ msg.timestamp | date:'HH:mm' }}</span>
                </div>
                <div class="px-4 py-2 rounded-2xl text-sm shadow-sm"
                     [ngClass]="isMe(msg.authorName || '') ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'">
                  {{ msg.content }}
                </div>
              </div>
            </div>
          }
        }
      </div>

      <!-- Input area -->
      <div class="p-4 bg-white border-t border-slate-200">
        <form (ngSubmit)="sendComment()" class="flex gap-2">
          <input type="text" [(ngModel)]="newComment" name="commentInput"
            placeholder="Nhập nội dung trao đổi..."
            class="flex-1 px-4 py-2 border border-slate-300 rounded-full text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            autocomplete="off" [disabled]="isSending()" />
          <button type="submit" [disabled]="!newComment.trim() || isSending()"
            class="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <svg class="w-4 h-4 translate-x-px -translate-y-px" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  `
})
export class RequestCommentsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) requestId!: number;

  newComment = '';
  comments = signal<CommentDto[]>([]);
  isSending = signal(false);
  private wsSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private commentService: RequestCommentService,
    private wsService: WebsocketService
  ) {}

  ngOnInit() {
    this.loadComments();
    
    // Subscribe to websocket for realtime updates
    this.wsSubscription = this.wsService.watchRequestUpdates(this.requestId).subscribe(message => {
      const newMsg: CommentDto = JSON.parse(message.body);
      
      // If the message is already in the list (e.g. we just sent it), don't add it again
      // We rely on ID.
      this.comments.update(list => {
        if (!list.find(c => c.id === newMsg.id)) {
          return [...list, newMsg];
        }
        return list;
      });
    });
  }

  ngOnDestroy() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadComments() {
    this.commentService.getComments(this.requestId).subscribe(data => {
      this.comments.set(data);
    });
  }

  isMe(authorName: string): boolean {
    return authorName === this.authService.currentUser()?.username;
  }

  sendComment(): void {
    const text = this.newComment.trim();
    if (!text) return;

    this.isSending.set(true);
    this.commentService.addComment(this.requestId, text).subscribe({
      next: (msg) => {
        this.newComment = '';
        this.isSending.set(false);
      },
      error: () => {
        this.isSending.set(false);
      }
    });
  }
}
