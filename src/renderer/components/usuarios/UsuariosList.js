// src/renderer/components/usuarios/UsuariosList.js
import React from 'react';

const UsuariosList = ({ usuarios, loading, onEdit, onDelete, roles }) => {
  const getRoleLabel = (rol) => {
    if (!rol) return 'Sin rol';
    const role = roles.find(r => r.value === rol);
    return role ? role.label : rol;
  };

  if (loading) {
    return <p className="loading-text">Cargando usuarios...</p>;
  }

  return (
    <div className="usuarios-list">
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo Electrónico</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr>
              <td colSpan="5" className="no-data">
                No hay usuarios registrados.
              </td>
            </tr>
          ) : (
            usuarios.map(user => (
              <tr key={user.id}>
                <td>{user.name || '—'}</td>
                <td>{user.email || '—'}</td>
                <td>{getRoleLabel(user.rol)}</td>
                <td>
                  <span
                    className={`status-badge ${
                      user.activo === true ? 'activo' : 'inactivo'
                    }`}
                    aria-label={`Usuario ${user.activo === true ? 'activo' : 'inactivo'}`}
                  >
                    {user.activo === true ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="acciones-celda">
                  <button
                    type="button"
                    className="btn-small btn-edit"
                    onClick={() => onEdit(user.id)}
                    aria-label={`Editar usuario ${user.name || user.email}`}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-small btn-delete"
                    onClick={() => onDelete(user.id, user.name || user.email)}
                    aria-label={`Eliminar usuario ${user.name || user.email}`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsuariosList;