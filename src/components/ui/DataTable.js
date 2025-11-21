import React, { useState, useMemo } from "react";
import "./DataTable.css";

/**
 * Componente reutilizable de tabla de datos con:
 * - Ordenamiento dinámico
 * - Búsqueda global
 * - Paginación
 * - Renderizado personalizado por columna
 * - Acciones configurables (icon, className pueden ser string o función(row))
 */
const DataTable = ({
  data = [],
  columns = [],
  actions = [],
  itemsPerPage = 6,
  enableSearch = true,
  searchPlaceholder = "Buscar...",
  initialSort = null,
  emptyStateText = "No hay registros disponibles",
  className = "",
}) => {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);

  // Obtener valor por path (ej: worker.name)
  const getValue = (obj = {}, path = "") => {
    if (!path) return undefined;
    return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
  };

  // Filtrado global simple sobre columnas con accessor
  const filteredData = useMemo(() => {
    if (!search) return data;
    const q = search.toString().toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = col.accessor ? getValue(row, col.accessor) : getValue(row, col.key);
        return value !== undefined && value !== null && value.toString().toLowerCase().includes(q);
      })
    );
  }, [search, data, columns]);

  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    const { key, direction } = sortConfig;
    const col = columns.find((c) => c.key === key);
    const accessor = col?.accessor || key;

    const copy = [...filteredData];
    copy.sort((a, b) => {
      const va = getValue(a, accessor);
      const vb = getValue(b, accessor);

      // manejar nulos/undefined
      if (va === undefined && vb === undefined) return 0;
      if (va === undefined) return 1;
      if (vb === undefined) return -1;

      // Si son strings, comparar case-insensitive
      if (typeof va === "string" && typeof vb === "string") {
        const A = va.toLowerCase();
        const B = vb.toLowerCase();
        if (A === B) return 0;
        return direction === "asc" ? (A > B ? 1 : -1) : A < B ? 1 : -1;
      }

      if (va === vb) return 0;
      return direction === "asc" ? (va > vb ? 1 : -1) : va < vb ? 1 : -1;
    });

    return copy;
  }, [filteredData, sortConfig, columns]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Cambiar orden
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        if (prev.direction === "asc") return { key, direction: "desc" };
        if (prev.direction === "desc") return null;
      }
      return { key, direction: "asc" };
    });
  };

  // Icono de orden
  const renderSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) return <i className="fas fa-sort sort-icon" aria-hidden="true" />;
    return sortConfig.direction === "asc" ? (
      <i className="fas fa-sort-up sort-icon active" aria-hidden="true" />
    ) : (
      <i className="fas fa-sort-down sort-icon active" aria-hidden="true" />
    );
  };

  // Helpers para acciones: soporta icon/className como string o función(row)
  const resolve = (maybeFn, row) => (typeof maybeFn === "function" ? maybeFn(row) : maybeFn);

  return (
    <div className={`data-table-container ${className}`}>
      {enableSearch && (
        <div className="search-bar-container">
          <div className="search-bar" role="search" aria-label="Buscar en la tabla">
            <i className="fas fa-search search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Buscar"
            />
            {search && (
              <button
                className="clear-search"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                aria-label="Limpiar búsqueda"
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="table-wrapper" role="table" aria-label="Tabla de datos">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.sortable ? "sortable" : ""}
                  onClick={() => col.sortable && handleSort(col.key)}
                  scope="col"
                  aria-sort={
                    sortConfig?.key === col.key ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"
                  }
                >
                  <div className="th-content">
                    <span className="th-title">{col.header}</span>
                    {col.sortable && renderSortIcon(col.key)}
                  </div>
                </th>
              ))}
              {actions.length > 0 && <th scope="col">Acciones</th>}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={row._id || idx}>
                  {columns.map((col) => (
                    <td key={col.key} data-label={col.header}>
                      {/* Si el column tiene render personalizado, usarlo */}
                      {col.render ? (
                        col.render(row)
                      ) : col.accessor ? (
                        getValue(row, col.accessor)
                      ) : (
                        getValue(row, col.key)
                      )}
                    </td>
                  ))}

                  {actions.length > 0 && (
                    <td className="actions-cell" role="cell">
                      {actions.map((action) => {
                        const btnClass = resolve(action.className, row) || "";
                        const iconClass = resolve(action.icon, row) || "";
                        const isGenerated = typeof action.isGenerated === "function" ? action.isGenerated(row) : false;
                        const extraGeneratedClass = action.key === "pdf" && isGenerated ? "generated" : "";
                        const ariaLabel = action.label || action.key || "acción";

                        return (
                          <button
                            key={action.key}
                            className={`action-btn ${btnClass} ${extraGeneratedClass}`}
                            onClick={() => action.onClick && action.onClick(row)}
                            title={ariaLabel}
                            aria-label={ariaLabel}
                          >
                            {action.renderIcon ? (
                              action.renderIcon(row)
                            ) : (
                              <i className={iconClass} aria-hidden="true" />
                            )}
                          </button>
                        );
                      })}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + (actions.length ? 1 : 0)}>
                  <div className="empty-state">{emptyStateText}</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination" role="navigation" aria-label="Paginación de tabla">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            <i className="fas fa-chevron-left" aria-hidden="true" />
          </button>

          <span className="page-info" aria-live="polite">
            Página {currentPage} de {totalPages}
          </span>

          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            aria-label="Página siguiente"
          >
            <i className="fas fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;

