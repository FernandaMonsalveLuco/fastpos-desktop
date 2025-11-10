// src/renderer/hooks/useCarrito.js
import { useState, useMemo } from 'react';

export const useCarrito = (ivaPorcentaje = 19) => {
  const [items, setItems] = useState([]);

  // Agregar producto (si ya existe, incrementa cantidad)
  const agregarProducto = (producto) => {
    setItems(prev => {
      const existe = prev.find(item => item.id === producto.id);
      if (existe) {
        return prev.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: (item.cantidad || 1) + 1 }
            : item
        );
      } else {
        return [...prev, { ...producto, cantidad: 1 }];
      }
    });
  };

  // Eliminar producto (completamente)
  const eliminarProducto = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Reducir cantidad (opcional, para botón "-")
  const reducirCantidad = (id) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nuevaCantidad = (item.cantidad || 1) - 1;
          if (nuevaCantidad <= 0) {
            return null; // Se eliminará después
          }
          return { ...item, cantidad: nuevaCantidad };
        }
        return item;
      }).filter(Boolean) // Elimina los null
    );
  };

  // Cálculos memoizados
  const subtotal = useMemo(() =>
    items.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0),
    [items]
  );

  const iva = useMemo(() =>
    Math.round(subtotal * (ivaPorcentaje / 100)),
    [subtotal, ivaPorcentaje]
  );

  const total = subtotal + iva;

  return {
    items,
    agregarProducto,
    eliminarProducto,
    reducirCantidad,
    subtotal,
    iva,
    total
  };
};