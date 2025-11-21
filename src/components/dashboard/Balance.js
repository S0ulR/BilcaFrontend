import React, { useState } from 'react';
import './Balance.css';

const Balance = () => {
  const [balance] = useState(1240.50);
  const [transactions] = useState([
    { id: 1, desc: 'Pago por servicio', amount: 300, date: '2024-04-10', type: 'income' },
    { id: 2, desc: 'Retiro a cuenta', amount: 150, date: '2024-04-08', type: 'expense' },
    { id: 3, desc: 'Pago por instalación eléctrica', amount: 250, date: '2024-04-05', type: 'income' },
    { id: 4, desc: 'Comisión plataforma', amount: 20, date: '2024-04-05', type: 'expense' }
  ]);

  return (
    <div className="balance-page">
      <h2>Balance y Transacciones</h2>

      <div className="balance-card">
        <h3>Saldo Disponible</h3>
        <div className="balance-amount">${balance.toFixed(2)}</div>
        <p>Actualizado al día de hoy</p>
      </div>

      <div className="transactions">
        <h3>Historial de Transacciones</h3>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Fecha</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty">No hay transacciones registradas.</td>
              </tr>
            ) : (
              transactions.map(t => (
                <tr key={t.id}>
                  <td>{t.desc}</td>
                  <td>{t.date}</td>
                  <td className={`amount ${t.type}`}>
                    {t.type === 'income' ? '+' : '-'} ${t.amount.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Balance;

