import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'

const InvoiceDetail = () => {
  const location = useLocation()
  const [data, setData] = useState(location.state)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const printInvoice = () => {
    window.print()
  }

  const downloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const input = document.getElementById('invoice-detail')
      const canvas = await html2canvas(input, {
        useCORS: true,
        scale: 2,
        logging: false,
        allowTaint: true
      })
      
      const imageData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      })
      
      const imageProps = pdf.getImageProperties(imageData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imageProps.height * pdfWidth) / imageProps.width
      
      pdf.addImage(imageData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`Invoice-${data.invoiceNumber || 'Unknown'}-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  // Calculate tax and discount amounts for display
  const calculateTaxAmount = () => {
    if (!data.taxValue || data.taxValue <= 0) return 0
    return data.taxType === 'percentage' 
      ? (data.subtotal * data.taxValue / 100) 
      : parseFloat(data.taxValue)
  }

  const calculateDiscountAmount = () => {
    if (!data.discountValue || data.discountValue <= 0) return 0
    return data.discountType === 'percentage' 
      ? (data.subtotal * data.discountValue / 100) 
      : parseFloat(data.discountValue)
  }

  return (
    <div>
      <div className='invoice-top-header'>
        <div className='invoice-actions'>
          <button onClick={printInvoice} className='action-btn print-btn'>
            <i className="fa-solid fa-print"></i> Print
          </button>
          <button 
            onClick={downloadPDF} 
            className='action-btn download-btn'
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <i className="fa-solid fa-spinner fa-spin-pulse"></i> Generating...
              </>
            ) : (
              <>
                <i className="fa-solid fa-download"></i> Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      <div id='invoice-detail' className='invoice-wrapper'>
        {/* Invoice Header */}
        <div className='invoice-header'>
          <div className='company-detail'>
            <img className='company-logo' alt='logo' src={localStorage.getItem('photoURL')} />
            <div className='company-info'>
              <h2 className='company-name'>{data.companyName || localStorage.getItem('cName')}</h2>
              {data.companyAddress && <p>{data.companyAddress}</p>}
              {data.companyPhone && <p>{data.companyPhone}</p>}
              <p>{data.companyEmail || localStorage.getItem('email')}</p>
            </div>
          </div>
          
          <div className='invoice-details'>
            <h1 className='invoice-title'>INVOICE</h1>
            <div className='invoice-meta'>
              <div className='meta-row'>
                <span className='meta-label'>Invoice #:</span>
                <span className='meta-value'>{data.invoiceNumber || 'N/A'}</span>
              </div>
              <div className='meta-row'>
                <span className='meta-label'>Date:</span>
                <span className='meta-value'>
                  {data.invoiceDate 
                    ? new Date(data.invoiceDate).toLocaleDateString() 
                    : new Date(data.date?.seconds * 1000).toLocaleDateString()
                  }
                </span>
              </div>
              {data.dueDate && (
                <div className='meta-row'>
                  <span className='meta-label'>Due Date:</span>
                  <span className='meta-value'>{new Date(data.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Client Information */}
        <div className='client-section'>
          <h3 className='section-title'>Bill To:</h3>
          <div className='client-info'>
            <p className='client-name'>{data.to}</p>
            {data.clientEmail && <p>{data.clientEmail}</p>}
            {data.phone && <p>{data.phone}</p>}
            <p>{data.address}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className='items-section'>
          <table className='invoice-table'>
            <thead>
              <tr>
                <th className='item-desc'>Description</th>
                <th className='item-qty'>Qty</th>
                <th className='item-price'>Unit Price</th>
                <th className='item-total'>Total</th>
              </tr>
            </thead>
            <tbody>
              {(data.lineItems || data.product || []).map((item, index) => (
                <tr key={item.id || index}>
                  <td className='item-desc'>{item.description || item.name}</td>
                  <td className='item-qty'>{item.quantity || item.qty}</td>
                  <td className='item-price'>${(item.unitPrice || item.price).toFixed(2)}</td>
                  <td className='item-total'>
                    ${((item.quantity || item.qty) * (item.unitPrice || item.price)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className='totals-section'>
          <div className='totals-container'>
            <div className='totals-row'>
              <span className='totals-label'>Subtotal:</span>
              <span className='totals-value'>${(data.subtotal || data.total).toFixed(2)}</span>
            </div>
            
            {data.taxValue > 0 && (
              <div className='totals-row'>
                <span className='totals-label'>
                  Tax ({data.taxType === 'percentage' ? `${data.taxValue}%` : `$${data.taxValue}`}):
                </span>
                <span className='totals-value'>${calculateTaxAmount().toFixed(2)}</span>
              </div>
            )}
            
            {data.discountValue > 0 && (
              <div className='totals-row'>
                <span className='totals-label'>
                  Discount ({data.discountType === 'percentage' ? `${data.discountValue}%` : `$${data.discountValue}`}):
                </span>
                <span className='totals-value discount'>-${calculateDiscountAmount().toFixed(2)}</span>
              </div>
            )}
            
            <div className='totals-row total-final'>
              <span className='totals-label'><strong>Total:</strong></span>
              <span className='totals-value'><strong>${data.total.toFixed(2)}</strong></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='invoice-footer'>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  )
}

export default InvoiceDetail