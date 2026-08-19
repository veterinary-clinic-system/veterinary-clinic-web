import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Table } from './Table';
import type { Column } from './Table';

/**
 * Ba trạng thái của một bảng phải PHÂN BIỆT ĐƯỢC với nhau.
 *
 * Bài kiểm tra này tồn tại vì bản trước của `Table` chỉ có hai: đang tải và "Không có dữ
 * liệu". Khi API hỏng, bảng rơi vào nhánh thứ hai - tức là màn hình tồn kho nói với thủ
 * kho rằng chi nhánh không có mặt hàng nào, trong khi thật ra máy chủ không trả lời. Ai
 * gỡ trạng thái lỗi đi sẽ làm đỏ bài này.
 */

/*
  Dọn DOM sau mỗi bài: vitest chạy với `globals: false` nên testing-library không tự gắn
  `afterEach` giúp. Thiếu dòng này, cây của bài trước còn nguyên trong document và
  `getByRole` kêu "tìm thấy nhiều phần tử".
*/
afterEach(cleanup);

interface Row {
  id: string;
  name: string;
}

const COLUMNS: Column<Row>[] = [{ key: 'name', header: 'Tên' }];
const ROWS: Row[] = [{ id: '1', name: 'Luna' }];

describe('Table', () => {
  it('vẽ skeleton khi đang tải, không phải dòng chữ', () => {
    const { container } = render(
      <Table columns={COLUMNS} data={[]} getRowId={(row) => row.id} loading />,
    );

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    expect(screen.queryByText('Không có dữ liệu')).toBeNull();
  });

  it('nói "không có dữ liệu" khi danh sách rỗng thật', () => {
    render(<Table columns={COLUMNS} data={[]} getRowId={(row) => row.id} />);

    expect(screen.getByText('Không có dữ liệu')).toBeTruthy();
  });

  it('phân biệt lỗi tải với danh sách rỗng, và mời thử lại', () => {
    const onRetry = vi.fn();
    render(<Table columns={COLUMNS} data={[]} getRowId={(row) => row.id} error onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByText('Không có dữ liệu')).toBeNull();
    screen.getByRole('button', { name: 'Thử lại' }).click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('lỗi thắng cả dữ liệu cũ còn sót lại', () => {
    /*
      `placeholderData` của react-query giữ lại kết quả của lần lọc trước trong lúc lần
      lọc mới đang chạy. Nếu lần mới hỏng mà bảng vẫn vẽ dữ liệu cũ, người dùng đang nhìn
      một danh sách KHÔNG khớp với bộ lọc đang hiện trên màn hình.
    */
    render(<Table columns={COLUMNS} data={ROWS} getRowId={(row) => row.id} error />);

    expect(screen.queryByText('Luna')).toBeNull();
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('đánh dấu cột đang sắp xếp bằng aria-sort cho trình đọc màn hình', () => {
    render(
      <Table
        columns={[{ key: 'name', header: 'Tên', sortable: true }]}
        data={ROWS}
        getRowId={(row) => row.id}
        sortBy="name"
        sortOrder="ASC"
        onSortChange={() => {}}
      />,
    );

    expect(screen.getByRole('columnheader').getAttribute('aria-sort')).toBe('ascending');
  });
});
