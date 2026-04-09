import { memo, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import type { SemanticBlock, DataTableMeta } from '../../core/types.js';

interface Props {
  block: SemanticBlock;
  Fallback: React.ComponentType<{ content: string }>;
}

type SortDir = 'asc' | 'desc' | null;

function naturalCompare(a: string, b: string): number {
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export const DataTableRenderer = memo(({ block, Fallback }: Props) => {
  const meta = block.meta as unknown as DataTableMeta;
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [filter, setFilter] = useState('');

  if (!meta?.headers?.length || !meta?.rows?.length) {
    return <Fallback content={block.rawMarkdown} />;
  }

  const filteredRows = useMemo(() => {
    let rows = meta.rows;
    if (filter.trim()) {
      const q = filter.toLowerCase();
      rows = rows.filter(row => row.some(cell => cell.toLowerCase().includes(q)));
    }
    if (sortCol !== null && sortDir) {
      rows = [...rows].sort((a, b) => {
        const cmp = naturalCompare(a[sortCol] || '', b[sortCol] || '');
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [meta.rows, filter, sortCol, sortDir]);

  const handleSort = (colIdx: number) => {
    if (sortCol === colIdx) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortCol(null); setSortDir(null); }
    } else {
      setSortCol(colIdx);
      setSortDir('asc');
    }
  };

  return (
    <motion.div
      className="sem-data-table"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sem-table-toolbar">
        <div className="sem-table-filter">
          <Search size={14} />
          <input
            type="text"
            placeholder="Filter rows..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
        <span className="sem-table-count">
          {filteredRows.length} of {meta.rows.length} rows
        </span>
      </div>

      <div className="sem-table-scroll">
        <table>
          <thead>
            <tr>
              {meta.headers.map((header, i) => (
                <th key={i} className="sem-sort-header" onClick={() => handleSort(i)}>
                  <span>{header}</span>
                  {sortCol === i && sortDir === 'asc' && <ArrowUp size={12} />}
                  {sortCol === i && sortDir === 'desc' && <ArrowDown size={12} />}
                  {sortCol !== i && <ArrowUpDown size={12} className="sem-sort-idle" />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
});

DataTableRenderer.displayName = 'DataTableRenderer';
