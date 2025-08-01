import React, { useEffect, useState } from 'react'
import { db } from '../../firebase'
import { collection, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

const Invoices = () => {
  const [invoices, setInvoices] = useState([])
  const [isLoading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  const navigate = useNavigate()

  useEffect(() => {
    getData()
  }, [])

  const getData = async () => {
    setLoading(true)
    try {
      const q = query(
        collection(db, "invoices"), 
        where('uid', "==", localStorage.getItem('uid')),
        orderBy('date', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: getInvoiceStatus(doc.data())
      }))
      setInvoices(data)
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInvoiceStatus = (invoice) => {
    if (!invoice.dueDate) return 'sent'
    
    const today = new Date()
    const dueDate = new Date(invoice.dueDate)
    
    if (dueDate < today) return 'overdue'
    if (dueDate.getTime() - today.getTime() <= 7 * 24 * 60 * 60 * 1000) return 'due-soon'
    return 'sent'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'overdue': return '#e74c3c'
      case 'due-soon': return '#f39c12'
      case 'sent': return '#27ae60'
      default: return '#3498db'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'overdue': return 'Overdue'
      case 'due-soon': return 'Due Soon'
      case 'sent': return 'Sent'
      default: return 'Draft'
    }
  }

  const deleteInvoice = async (id) => {
    const isSure = window.confirm("Are you sure you want to delete this invoice?")
    if (isSure) {
      try {
        await deleteDoc(doc(db, 'invoices', id))
        getData()
      } catch (error) {
        console.error('Error deleting invoice:', error)
        window.alert("Something went wrong while deleting the invoice")
      }
    }
  }

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (invoice.invoiceNumber && invoice.invoiceNumber.includes(searchTerm))
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.date?.seconds * 1000) - new Date(a.date?.seconds * 1000)
      case 'amount':
        return b.total - a.total
      case 'client':
        return a.to.localeCompare(b.to)
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0)
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length
  const dueSoonCount = invoices.filter(inv => inv.status === 'due-soon').length

  return (
    <div className='invoices-container'>
      {/* Header with Stats */}
      <div className='invoices-header'>
        <div className='invoices-title-section'>
          <h1 className='invoices-title'>
            <i className="fa-solid fa-file-invoice"></i> Invoices
          </h1>
          <button 
            onClick={() => navigate('/dashboard/new-invoice')} 
            className='create-invoice-btn'
          >
            <i className="fa-solid fa-plus"></i> Create Invoice
          </button>
        </div>
        
        <div className='invoices-stats'>
          <div className='stat-card'>
            <div className='stat-value'>{invoices.length}</div>
            <div className='stat-label'>Total Invoices</div>
          </div>
          <div className='stat-card'>
            <div className='stat-value'>${totalAmount.toFixed(2)}</div>
            <div className='stat-label'>Total Amount</div>
          </div>
          <div className='stat-card warning'>
            <div className='stat-value'>{overdueCount}</div>
            <div className='stat-label'>Overdue</div>
          </div>
          <div className='stat-card info'>
            <div className='stat-value'>{dueSoonCount}</div>
            <div className='stat-label'>Due Soon</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className='invoices-filters'>
        <div className='search-container'>
          <i className="fa-solid fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Search by client name or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='search-input'
          />
        </div>
        
        <div className='filter-container'>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='filter-select'
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="due-soon">Due Soon</option>
            <option value="overdue">Overdue</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className='filter-select'
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="client">Sort by Client</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className='loading-container'>
          <i className="fa-solid fa-spinner fa-spin-pulse loading-spinner"></i>
          <p>Loading invoices...</p>
        </div>
      ) : (
        <div className='invoices-content'>
          {/* Desktop Table View */}
          <div className='invoices-table-container desktop-only'>
            <table className='invoices-table'>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedInvoices.map(invoice => (
                  <tr key={invoice.id} className='invoice-row'>
                    <td className='invoice-number'>
                      #{invoice.invoiceNumber || 'N/A'}
                    </td>
                    <td className='client-name'>{invoice.to}</td>
                    <td className='invoice-date'>
                      {new Date(invoice.date?.seconds * 1000).toLocaleDateString()}
                    </td>
                    <td className='due-date'>
                      {invoice.dueDate 
                        ? new Date(invoice.dueDate).toLocaleDateString() 
                        : 'N/A'
                      }
                    </td>
                    <td className='invoice-amount'>${invoice.total.toFixed(2)}</td>
                    <td className='invoice-status'>
                      <span 
                        className='status-badge'
                        style={{ backgroundColor: getStatusColor(invoice.status) }}
                      >
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className='invoice-actions'>
                      <button
                        onClick={() => navigate('/dashboard/invoice-detail', { state: invoice })}
                        className='action-btn view-btn'
                        title="View Invoice"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        className='action-btn delete-btn'
                        title="Delete Invoice"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className='invoices-cards mobile-only'>
            {sortedInvoices.map(invoice => (
              <div key={invoice.id} className='invoice-card'>
                <div className='card-header'>
                  <div className='invoice-info'>
                    <h3>#{invoice.invoiceNumber || 'N/A'}</h3>
                    <span 
                      className='status-badge'
                      style={{ backgroundColor: getStatusColor(invoice.status) }}
                    >
                      {getStatusText(invoice.status)}
                    </span>
                  </div>
                  <div className='card-amount'>${invoice.total.toFixed(2)}</div>
                </div>
                
                <div className='card-body'>
                  <p><strong>Client:</strong> {invoice.to}</p>
                  <p><strong>Date:</strong> {new Date(invoice.date?.seconds * 1000).toLocaleDateString()}</p>
                  {invoice.dueDate && (
                    <p><strong>Due:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
                  )}
                </div>
                
                <div className='card-actions'>
                  <button
                    onClick={() => navigate('/dashboard/invoice-detail', { state: invoice })}
                    className='action-btn view-btn'
                  >
                    <i className="fa-solid fa-eye"></i> View
                  </button>
                  <button
                    onClick={() => deleteInvoice(invoice.id)}
                    className='action-btn delete-btn'
                  >
                    <i className="fa-solid fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {sortedInvoices.length === 0 && !isLoading && (
            <div className='empty-state'>
              <div className='empty-icon'>
                <i className="fa-solid fa-file-invoice"></i>
              </div>
              <h3>No invoices found</h3>
              <p>
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Create your first invoice to get started'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button 
                  onClick={() => navigate('/dashboard/new-invoice')} 
                  className='create-first-invoice-btn'
                >
                  <i className="fa-solid fa-plus"></i> Create Your First Invoice
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Invoices