import {
  Component, Input, Output, EventEmitter,
  ChangeDetectionStrategy, OnInit, OnDestroy, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

/**
 * Shared Search Bar Component — ô tìm kiếm có debounce built-in.
 *
 * Dumb component: nhận giá trị và emit search events.
 * Có nút clear và debounce 300ms mặc định.
 *
 * @example
 * <app-search-bar
 *   placeholder="Username, email, họ tên..."
 *   [value]="searchQuery()"
 *   (valueChange)="searchQuery.set($event)"
 * />
 *
 * @see SHARED-COMPONENTS-STRATEGY.md — Molecule component
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
        <app-icon name="search" size="sm" />
      </div>
      <input
        type="text"
        [value]="internalValue()"
        [placeholder]="placeholder"
        (input)="onInput($event)"
        (keydown.escape)="onClear()"
        class="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-sm
               outline-none transition-colors duration-200
               focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-label="Tìm kiếm"
      />
      @if (internalValue()) {
        <button
          type="button"
          (click)="onClear()"
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400
                 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="Xóa tìm kiếm"
        >
          <app-icon name="x" size="sm" />
        </button>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  /** Placeholder text */
  @Input() placeholder = 'Tìm kiếm...';

  /** Giá trị từ bên ngoài (two-way binding) */
  @Input()
  set value(val: string) {
    this.internalValue.set(val ?? '');
  }

  /** Debounce time (ms) */
  @Input() debounce = 300;

  /** Emit giá trị mới sau debounce */
  @Output() valueChange = new EventEmitter<string>();

  /** Emit khi user nhấn Enter */
  @Output() search = new EventEmitter<string>();

  /** Giá trị nội bộ */
  internalValue = signal('');

  /** Subject cho debounce */
  private _searchSubject = new Subject<string>();
  private _destroy$ = new Subject<void>();

  ngOnInit(): void {
    this._searchSubject.pipe(
      debounceTime(this.debounce),
      distinctUntilChanged(),
      takeUntil(this._destroy$),
    ).subscribe(value => {
      this.valueChange.emit(value);
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /** Xử lý input event */
  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.internalValue.set(val);
    this._searchSubject.next(val);
  }

  /** Xóa giá trị tìm kiếm */
  onClear(): void {
    this.internalValue.set('');
    this._searchSubject.next('');
    this.valueChange.emit('');
  }
}
