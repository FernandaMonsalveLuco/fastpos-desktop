// src/renderer/components/usuarios/UsuariosList.js
import React from 'react';

const UsuariosList = ({ usuarios, loading, onEdit, onDelete, roles }) => {
  const getRoleLabel = (rol) => {
    const role = roles.find(r => r.value === rol);
    return role ? role.label : rol;
  };

  if (loading) return <p>Cargando usuarios...</p>;

  return (
    <div className="usuarios-list">
      <table className="usuarios-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>No hay usuarios registrados.</td>
            </tr>
          ) : (
            usuarios.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{getRoleLabel(user.rol)}</td>
                <td>
                  <span className={`status-badge ${user.activo ? 'activo' : 'inactivo'}`}>
                    {user.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button className="btn-small btn-edit" onClick={() => onEdit(user.id)}>
                    Editar
                  </button>
                  <button 
                    className="btn-small btn-delete" 
                    onClick={() => onDelete(user.id, user.name)} 
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