// src/renderer/components/usuarios/UsuarioForm.js
import React, { useState } from 'react';

const UsuarioForm = ({ initialValues, roles, onSubmit, onCancel, isEditing }) => {
  const [formData, setFormData] = useState({
    name: initialValues?.name || '',          // ✅ "name", no "nombre"
    email: initialValues?.email || '',
    rol: initialValues?.rol || roles[0].value,
    activo: initialValues ? initialValues.activo !== false : true,
    password: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // ✅ Validar usando "name", no "nombre"
    if (!formData.name || !formData.email) {
      alert('Nombre y correo son obligatorios.');
      return;
    }
    if (!isEditing && !formData.password) {
      alert('La contraseña es obligatoria al crear un usuario.');
      return;
    }
    if (!isEditing && formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="usuario-form-container">
      <h3>{isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nombre completo</label>
          <input
            type="text"
            name="name"               // ✅ coincide con el estado
            value={formData.name}     // ✅
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Correo electrónico</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        {!isEditing && (
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEditing}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
        )}

        <div className="form-group">
          <label>Rol</label>
          <select name="rol" value={formData.rol} onChange={handleChange}>
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        {isEditing && (
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
              />
              Usuario activo
            </label>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            {isEditing ? 'Actualizar' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsuarioForm;