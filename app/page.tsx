"use client"
import React, { useState, useMemo } from 'react';
import { Plus, Upload, Download, Edit2, Trash2, Settings, Moon, Sun, Save, X } from 'lucide-react';
import Papa from 'papaparse';

// Types
interface Person {
  id: string;
  name: string;
  email: string;
  age: number;
  role: string;
  department?: string;
  location?: string;
  [key: string]: any;
}

interface Column {
  id: string;
  label: string;
  visible: boolean;
  sortable: boolean;
}

type SortOrder = 'asc' | 'desc';

// Initial data
const initialData: Person[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', age: 28, role: 'Developer', department: 'Engineering', location: 'New York' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 34, role: 'Designer', department: 'Design', location: 'San Francisco' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', age: 45, role: 'Manager', department: 'Operations', location: 'Chicago' },
  { id: '4', name: 'Alice Williams', email: 'alice@example.com', age: 29, role: 'Developer', department: 'Engineering', location: 'Austin' },
  { id: '5', name: 'Charlie Brown', email: 'charlie@example.com', age: 52, role: 'Director', department: 'Executive', location: 'Boston' },
  { id: '6', name: 'Diana Prince', email: 'diana@example.com', age: 31, role: 'Designer', department: 'Design', location: 'Seattle' },
  { id: '7', name: 'Ethan Hunt', email: 'ethan@example.com', age: 38, role: 'Developer', department: 'Engineering', location: 'Denver' },
  { id: '8', name: 'Fiona Green', email: 'fiona@example.com', age: 27, role: 'Analyst', department: 'Analytics', location: 'Portland' },
  { id: '9', name: 'George Martin', email: 'george@example.com', age: 41, role: 'Manager', department: 'Operations', location: 'Miami' },
  { id: '10', name: 'Hannah Lee', email: 'hannah@example.com', age: 33, role: 'Designer', department: 'Design', location: 'LA' },
  { id: '11', name: 'Ian Malcolm', email: 'ian@example.com', age: 39, role: 'Analyst', department: 'Analytics', location: 'Houston' },
  { id: '12', name: 'Julia Roberts', email: 'julia@example.com', age: 30, role: 'Developer', department: 'Engineering', location: 'Phoenix' },
];

const defaultColumns: Column[] = [
  { id: 'name', label: 'Name', visible: true, sortable: true },
  { id: 'email', label: 'Email', visible: true, sortable: true },
  { id: 'age', label: 'Age', visible: true, sortable: true },
  { id: 'role', label: 'Role', visible: true, sortable: true },
  { id: 'department', label: 'Department', visible: false, sortable: true },
  { id: 'location', label: 'Location', visible: false, sortable: true },
];

export default function DataTableManager() {
  const [data, setData] = useState<Person[]>(initialData);
  const [columns, setColumns] = useState<Column[]>(() => {
    const saved = localStorage.getItem('tableColumns');
    return saved ? JSON.parse(saved) : defaultColumns;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [darkMode, setDarkMode] = useState(false);
  const [manageColumnsOpen, setManageColumnsOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editedData, setEditedData] = useState<{ [key: string]: Person }>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  React.useEffect(() => {
    localStorage.setItem('tableColumns', JSON.stringify(columns));
  }, [columns]);

  const filteredData = useMemo(() => {
    let filtered = data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );

    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortOrder === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });

    return filtered;
  }, [data, searchQuery, sortBy, sortOrder]);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const visibleColumns = columns.filter(col => col.visible);

  const handleSort = (columnId: string) => {
    if (sortBy === columnId) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnId);
      setSortOrder('asc');
    }
  };

  const toggleColumn = (columnId: string) => {
    setColumns(columns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const addNewColumn = () => {
    if (!newColumnName.trim()) return;
    
    const columnId = newColumnName.toLowerCase().replace(/\s+/g, '_');
    
    if (columns.find(col => col.id === columnId)) {
      setSnackbar({ open: true, message: 'Column already exists!', severity: 'error' });
      return;
    }

    setColumns([...columns, {
      id: columnId,
      label: newColumnName,
      visible: true,
      sortable: true
    }]);

    setData(data.map(row => ({ ...row, [columnId]: '' })));
    setNewColumnName('');
    setSnackbar({ open: true, message: 'Column added successfully!', severity: 'success' });
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setSnackbar({ open: true, message: 'Error parsing CSV!', severity: 'error' });
          return;
        }

        const imported = results.data.map((row: any, idx) => ({
          id: `imported-${Date.now()}-${idx}`,
          ...row,
          age: row.age ? Number(row.age) : 0
        }));

        setData([...data, ...imported]);
        setSnackbar({ open: true, message: `Imported ${imported.length} rows!`, severity: 'success' });
      },
      error: () => {
        setSnackbar({ open: true, message: 'Failed to import CSV!', severity: 'error' });
      }
    });

    e.target.value = '';
  };

  const handleExportCSV = () => {
    const exportData = filteredData.map(row => {
      const exported: any = {};
      visibleColumns.forEach(col => {
        exported[col.label] = row[col.id];
      });
      return exported;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `table-export-${Date.now()}.csv`;
    link.click();
    
    setSnackbar({ open: true, message: 'CSV exported successfully!', severity: 'success' });
  };

  const startEditing = (id: string) => {
    const row = data.find(r => r.id === id);
    if (row) {
      setEditingRows(new Set(editingRows).add(id));
      setEditedData({ ...editedData, [id]: { ...row } });
    }
  };

  const cancelEditing = (id: string) => {
    const newEditing = new Set(editingRows);
    newEditing.delete(id);
    setEditingRows(newEditing);
    
    const newEditedData = { ...editedData };
    delete newEditedData[id];
    setEditedData(newEditedData);
  };

  const saveEditing = (id: string) => {
    const edited = editedData[id];
    if (!edited) return;

    if (edited.age && isNaN(Number(edited.age))) {
      setSnackbar({ open: true, message: 'Age must be a number!', severity: 'error' });
      return;
    }

    setData(data.map(row => row.id === id ? { ...edited, age: Number(edited.age) } : row));
    cancelEditing(id);
    setSnackbar({ open: true, message: 'Row updated successfully!', severity: 'success' });
  };

  const saveAllEdits = () => {
    let hasError = false;
    
    Object.values(editedData).forEach(row => {
      if (row.age && isNaN(Number(row.age))) {
        hasError = true;
      }
    });

    if (hasError) {
      setSnackbar({ open: true, message: 'Please fix validation errors!', severity: 'error' });
      return;
    }

    setData(data.map(row => {
      const edited = editedData[row.id];
      return edited ? { ...edited, age: Number(edited.age) } : row;
    }));

    setEditingRows(new Set());
    setEditedData({});
    setSnackbar({ open: true, message: 'All changes saved!', severity: 'success' });
  };

  const cancelAllEdits = () => {
    setEditingRows(new Set());
    setEditedData({});
    setSnackbar({ open: true, message: 'All changes cancelled', severity: 'success' });
  };

  const handleDelete = (id: string) => {
    setData(data.filter(row => row.id !== id));
    setDeleteConfirm(null);
    setSnackbar({ open: true, message: 'Row deleted successfully!', severity: 'success' });
  };

  const updateEditedField = (id: string, field: string, value: any) => {
    setEditedData({
      ...editedData,
      [id]: {
        ...editedData[id],
        [field]: value
      }
    });
  };

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const styles = {
    container: {
      minHeight: '100vh',
      background: darkMode ? '#0f172a' : '#f8fafc',
      color: darkMode ? '#e2e8f0' : '#1e293b',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      margin: 0
    },
    controls: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem',
      flexWrap: 'wrap' as const,
      alignItems: 'center'
    },
    input: {
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
      background: darkMode ? '#1e293b' : '#fff',
      color: darkMode ? '#e2e8f0' : '#1e293b',
      fontSize: '0.875rem',
      outline: 'none',
      flexGrow: 1,
      minWidth: '200px'
    },
    button: {
      padding: '0.5rem 1rem',
      borderRadius: '0.5rem',
      border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1',
      background: darkMode ? '#334155' : '#fff',
      color: darkMode ? '#e2e8f0' : '#1e293b',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s'
    },
    primaryButton: {
      background: darkMode ? '#3b82f6' : '#2563eb',
      color: '#fff',
      border: 'none'
    },
    successButton: {
      background: '#10b981',
      color: '#fff',
      border: 'none'
    },
    dangerButton: {
      background: '#ef4444',
      color: '#fff',
      border: 'none'
    },
    table: {
      width: '100%',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      background: darkMode ? '#1e293b' : '#fff',
      boxShadow: darkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
    },
    th: {
      padding: '1rem',
      textAlign: 'left' as const,
      fontWeight: '600',
      background: darkMode ? '#0f172a' : '#f1f5f9',
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
      cursor: 'pointer',
      userSelect: 'none' as const
    },
    td: {
      padding: '1rem',
      borderBottom: darkMode ? '1px solid #334155' : '1px solid #e2e8f0'
    },
    iconButton: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '0.25rem',
      borderRadius: '0.25rem',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: darkMode ? '#94a3b8' : '#64748b',
      transition: 'all 0.2s'
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    modalContent: {
      background: darkMode ? '#1e293b' : '#fff',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    snackbar: {
      position: 'fixed' as const,
      bottom: '2rem',
      right: '2rem',
      padding: '1rem 1.5rem',
      borderRadius: '0.5rem',
      background: snackbar.severity === 'success' ? '#10b981' : '#ef4444',
      color: '#fff',
      fontWeight: '500',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1001
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dynamic Data Table Manager</h1>
        <button
          style={styles.iconButton}
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search all fields..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.input}
        />
        
        <input
          accept=".csv"
          style={{ display: 'none' }}
          id="csv-upload"
          type="file"
          onChange={handleImportCSV}
        />
        <label htmlFor="csv-upload">
          <button style={styles.button} onClick={() => document.getElementById('csv-upload')?.click()}>
            <Upload size={18} />
            Import CSV
          </button>
        </label>

        <button style={styles.button} onClick={handleExportCSV}>
          <Download size={18} />
          Export CSV
        </button>

        <button style={styles.button} onClick={() => setManageColumnsOpen(true)}>
          <Settings size={18} />
          Manage Columns
        </button>
      </div>

      {editingRows.size > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button style={{...styles.button, ...styles.successButton}} onClick={saveAllEdits}>
            <Save size={18} />
            Save All ({editingRows.size})
          </button>
          <button style={{...styles.button, ...styles.dangerButton}} onClick={cancelAllEdits}>
            <X size={18} />
            Cancel All
          </button>
        </div>
      )}

      <div style={styles.table}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  style={styles.th}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {col.label}
                    {sortBy === col.id && (
                      <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
              ))}
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => {
              const isEditing = editingRows.has(row.id);
              const displayRow = isEditing ? editedData[row.id] : row;

              return (
                <tr
                  key={row.id}
                  onDoubleClick={() => !isEditing && startEditing(row.id)}
                  style={{
                    cursor: !isEditing ? 'pointer' : 'default',
                    background: darkMode ? '#1e293b' : '#fff'
                  }}
                  onMouseEnter={(e) => {
                    if (!isEditing) e.currentTarget.style.background = darkMode ? '#334155' : '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = darkMode ? '#1e293b' : '#fff';
                  }}
                >
                  {visibleColumns.map((col) => (
                    <td key={col.id} style={styles.td}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={displayRow[col.id] || ''}
                          onChange={(e) => updateEditedField(row.id, col.id, e.target.value)}
                          style={{
                            ...styles.input,
                            flexGrow: 0,
                            minWidth: 0,
                            width: '100%',
                            border: col.id === 'age' && isNaN(Number(displayRow.age)) ? '1px solid #ef4444' : undefined
                          }}
                        />
                      ) : (
                        displayRow[col.id]
                      )}
                    </td>
                  ))}
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {isEditing ? (
                        <>
                          <button
                            style={{...styles.iconButton, color: '#10b981'}}
                            onClick={() => saveEditing(row.id)}
                            title="Save"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            style={{...styles.iconButton, color: '#ef4444'}}
                            onClick={() => cancelEditing(row.id)}
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            style={styles.iconButton}
                            onClick={() => startEditing(row.id)}
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            style={{...styles.iconButton, color: '#ef4444'}}
                            onClick={() => setDeleteConfirm(row.id)}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: darkMode ? '#94a3b8' : '#64748b' }}>
          Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filteredData.length)} of {filteredData.length} entries
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            style={styles.button}
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            Previous
          </button>
          <span style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            style={styles.button}
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      </div>

      {manageColumnsOpen && (
        <div style={styles.modal} onClick={() => setManageColumnsOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Manage Columns</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Add New Column</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Column name"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  style={{...styles.input, flexGrow: 1, minWidth: 0}}
                />
                <button style={{...styles.button, ...styles.primaryButton}} onClick={addNewColumn}>
                  <Plus size={18} />
                  Add
                </button>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Show/Hide Columns</h3>
            <div>
              {columns.map((col) => (
                <label
                  key={col.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={col.visible}
                    onChange={() => toggleColumn(col.id)}
                    style={{ cursor: 'pointer' }}
                  />
                  {col.label}
                </label>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button style={styles.button} onClick={() => setManageColumnsOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={styles.modal} onClick={() => setDeleteConfirm(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Confirm Delete</h2>
            <p>Are you sure you want to delete this row? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button style={styles.button} onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button
                style={{...styles.button, ...styles.dangerButton}}
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {snackbar.open && (
        <div style={styles.snackbar}>
          {snackbar.message}
        </div>
      )}
    </div>
  );
}