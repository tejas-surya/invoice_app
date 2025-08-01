import React, { useState, useEffect } from 'react'
import {db} from '../../firebase'
import { Timestamp, addDoc, collection, getDocs, query, where, orderBy, limit} from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

const NewInvoice = () => {
    // Client Information
    const [to, setTo] = useState('')
    const [clientEmail, setClientEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    
    // Company Information
    const [companyName, setCompanyName] = useState(localStorage.getItem('cName') || '')
    const [companyAddress, setCompanyAddress] = useState('')
    const [companyPhone, setCompanyPhone] = useState('')
    const [companyEmail, setCompanyEmail] = useState(localStorage.getItem('email') || '')
    
    // Invoice Details
    const [invoiceNumber, setInvoiceNumber] = useState('')
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
    const [dueDate, setDueDate] = useState('')
    
    // Line Items
    const [itemDescription, setItemDescription] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [unitPrice, setUnitPrice] = useState('')
    const [lineItems, setLineItems] = useState([])
    
    // Calculations
    const [subtotal, setSubtotal] = useState(0)
    const [taxType, setTaxType] = useState('percentage') // 'percentage' or 'fixed'
    const [taxValue, setTaxValue] = useState(0)
    const [discountType, setDiscountType] = useState('percentage') // 'percentage' or 'fixed'
    const [discountValue, setDiscountValue] = useState(0)
    const [total, setTotal] = useState(0)
    
    const [isLoading, setLoading] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    const navigation = useNavigate()

    useEffect(() => {
        generateInvoiceNumber()
        calculateDueDate()
    }, [])

    useEffect(() => {
        calculateTotals()
    }, [lineItems, taxValue, taxType, discountValue, discountType])

    const generateInvoiceNumber = async () => {
        try {
            const q = query(
                collection(db, "invoices"), 
                where('uid', "==", localStorage.getItem('uid')),
                orderBy('invoiceNumber', 'desc'),
                limit(1)
            )
            const querySnapshot = await getDocs(q)
            
            let nextNumber = 1001
            if (!querySnapshot.empty) {
                const lastInvoice = querySnapshot.docs[0].data()
                const lastNumber = parseInt(lastInvoice.invoiceNumber) || 1000
                nextNumber = lastNumber + 1
            }
            
            setInvoiceNumber(nextNumber.toString())
        } catch (error) {
            console.log('Error generating invoice number:', error)
            setInvoiceNumber('1001')
        }
    }

    const calculateDueDate = () => {
        const today = new Date()
        const due = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days from today
        setDueDate(due.toISOString().split('T')[0])
    }

    const addLineItem = () => {
        if (!itemDescription || !quantity || !unitPrice) {
            alert('Please fill in all item fields')
            return
        }

        const newItem = {
            id: lineItems.length,
            description: itemDescription,
            quantity: parseFloat(quantity),
            unitPrice: parseFloat(unitPrice),
            total: parseFloat(quantity) * parseFloat(unitPrice)
        }

        setLineItems([...lineItems, newItem])
        setItemDescription('')
        setQuantity(1)
        setUnitPrice('')
    }

    const removeLineItem = (id) => {
        setLineItems(lineItems.filter(item => item.id !== id))
    }

    const calculateTotals = () => {
        const sub = lineItems.reduce((sum, item) => sum + item.total, 0)
        setSubtotal(sub)

        let taxAmount = 0
        if (taxValue > 0) {
            taxAmount = taxType === 'percentage' ? (sub * taxValue / 100) : parseFloat(taxValue)
        }

        let discountAmount = 0
        if (discountValue > 0) {
            discountAmount = discountType === 'percentage' ? (sub * discountValue / 100) : parseFloat(discountValue)
        }

        const finalTotal = sub + taxAmount - discountAmount
        setTotal(Math.max(0, finalTotal))
    }

    const saveData = async () => {
        if (!to || !address || lineItems.length === 0) {
            alert('Please fill in client information and add at least one line item')
            return
        }

        setLoading(true)
        try {
            const invoiceData = {
                // Client Info
                to: to,
                clientEmail: clientEmail,
                phone: phone,
                address: address,
                
                // Company Info
                companyName: companyName,
                companyAddress: companyAddress,
                companyPhone: companyPhone,
                companyEmail: companyEmail,
                
                // Invoice Details
                invoiceNumber: invoiceNumber,
                invoiceDate: invoiceDate,
                dueDate: dueDate,
                
                // Line Items and Totals
                lineItems: lineItems,
                subtotal: subtotal,
                taxType: taxType,
                taxValue: taxValue,
                discountType: discountType,
                discountValue: discountValue,
                total: total,
                
                // Legacy fields for compatibility
                product: lineItems.map(item => ({
                    id: item.id,
                    name: item.description,
                    price: item.unitPrice,
                    qty: item.quantity
                })),
                
                uid: localStorage.getItem('uid'),
                date: Timestamp.fromDate(new Date(invoiceDate))
            }

            await addDoc(collection(db, 'invoices'), invoiceData)
            navigation('/dashboard/invoices')
        } catch (error) {
            console.error('Error saving invoice:', error)
            alert('Error saving invoice. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const togglePreview = () => {
        setShowPreview(!showPreview)
    }

    if (showPreview) {
        return (
            <div>
                <div className='header-row'>
                    <p className='new-invoice-heading'>Invoice Preview</p>
                    <div className='preview-actions'>
                        <button onClick={togglePreview} className='preview-btn secondary'>
                            <i className="fa-solid fa-edit"></i> Edit
                        </button>
                        <button onClick={saveData} className='preview-btn primary' disabled={isLoading}>
                            {isLoading && <i className="fa-solid fa-spinner fa-spin-pulse"></i>} Save Invoice
                        </button>
                    </div>
                </div>
                
                <div id='invoice-preview' className='invoice-preview-wrapper'>
                    <div className='invoice-header-preview'>
                        <div className='company-detail-preview'>
                            <img className='company-logo-preview' alt='logo' src={localStorage.getItem('photoURL')}/>
                            <h2 className='company-name-preview'>{companyName}</h2>
                            <p>{companyAddress}</p>
                            <p>{companyPhone}</p>
                            <p>{companyEmail}</p>
                        </div>
                        <div className='invoice-details-preview'>
                            <h1>INVOICE</h1>
                            <div className='invoice-meta'>
                                <p><strong>Invoice #:</strong> {invoiceNumber}</p>
                                <p><strong>Date:</strong> {new Date(invoiceDate).toLocaleDateString()}</p>
                                <p><strong>Due Date:</strong> {new Date(dueDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className='client-info-preview'>
                        <h3>Bill To:</h3>
                        <p><strong>{to}</strong></p>
                        <p>{clientEmail}</p>
                        <p>{phone}</p>
                        <p>{address}</p>
                    </div>
                    
                    <table className='preview-table'>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lineItems.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.description}</td>
                                    <td>{item.quantity}</td>
                                    <td>${item.unitPrice.toFixed(2)}</td>
                                    <td>${item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className='totals-preview'>
                        <div className='totals-row'>
                            <span>Subtotal:</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        {taxValue > 0 && (
                            <div className='totals-row'>
                                <span>Tax ({taxType === 'percentage' ? `${taxValue}%` : `$${taxValue}`}):</span>
                                <span>${(taxType === 'percentage' ? (subtotal * taxValue / 100) : parseFloat(taxValue)).toFixed(2)}</span>
                            </div>
                        )}
                        {discountValue > 0 && (
                            <div className='totals-row'>
                                <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`}):</span>
                                <span>-${(discountType === 'percentage' ? (subtotal * discountValue / 100) : parseFloat(discountValue)).toFixed(2)}</span>
                            </div>
                        )}
                        <div className='totals-row total-final'>
                            <span><strong>Total:</strong></span>
                            <span><strong>${total.toFixed(2)}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className='header-row'>
                <p className='new-invoice-heading'>Create New Invoice</p>
                <div className='header-actions'>
                    <button onClick={togglePreview} className='add-btn secondary' disabled={lineItems.length === 0}>
                        <i className="fa-solid fa-eye"></i> Preview
                    </button>
                    <button onClick={saveData} className='add-btn primary' disabled={isLoading}>
                        {isLoading && <i className="fa-solid fa-spinner fa-spin-pulse"></i>} Save Invoice
                    </button>
                </div>
            </div>

            {/* Company Information */}
            <div className='form-section'>
                <h3 className='section-title'>
                    <i className="fa-solid fa-building"></i> Company Information
                </h3>
                <div className='form-grid'>
                    <input 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)} 
                        placeholder='Company Name' 
                        className='form-input'
                    />
                    <input 
                        value={companyEmail} 
                        onChange={(e) => setCompanyEmail(e.target.value)} 
                        placeholder='Company Email' 
                        type='email'
                        className='form-input'
                    />
                    <input 
                        value={companyPhone} 
                        onChange={(e) => setCompanyPhone(e.target.value)} 
                        placeholder='Company Phone' 
                        className='form-input'
                    />
                    <input 
                        value={companyAddress} 
                        onChange={(e) => setCompanyAddress(e.target.value)} 
                        placeholder='Company Address' 
                        className='form-input full-width'
                    />
                </div>
            </div>

            {/* Invoice Details */}
            <div className='form-section'>
                <h3 className='section-title'>
                    <i className="fa-solid fa-file-invoice"></i> Invoice Details
                </h3>
                <div className='form-grid'>
                    <input 
                        value={invoiceNumber} 
                        onChange={(e) => setInvoiceNumber(e.target.value)} 
                        placeholder='Invoice Number' 
                        className='form-input'
                    />
                    <input 
                        value={invoiceDate} 
                        onChange={(e) => setInvoiceDate(e.target.value)} 
                        type='date' 
                        className='form-input'
                    />
                    <input 
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)} 
                        type='date' 
                        className='form-input'
                    />
                </div>
            </div>

            {/* Client Information */}
            <div className='form-section'>
                <h3 className='section-title'>
                    <i className="fa-solid fa-user"></i> Client Information
                </h3>
                <div className='form-grid'>
                    <input 
                        value={to} 
                        onChange={(e) => setTo(e.target.value)} 
                        placeholder='Client Name' 
                        className='form-input'
                        required
                    />
                    <input 
                        value={clientEmail} 
                        onChange={(e) => setClientEmail(e.target.value)} 
                        placeholder='Client Email' 
                        type='email'
                        className='form-input'
                    />
                    <input 
                        value={phone} 
                        onChange={(e) => setPhone(e.target.value)} 
                        placeholder='Client Phone' 
                        className='form-input'
                    />
                    <input 
                        value={address} 
                        onChange={(e) => setAddress(e.target.value)} 
                        placeholder='Client Address' 
                        className='form-input full-width'
                        required
                    />
                </div>
            </div>

            {/* Line Items */}
            <div className='form-section'>
                <h3 className='section-title'>
                    <i className="fa-solid fa-list"></i> Line Items
                </h3>
                <div className='line-item-form'>
                    <div className='form-grid'>
                        <input 
                            value={itemDescription} 
                            onChange={(e) => setItemDescription(e.target.value)} 
                            placeholder='Item Description' 
                            className='form-input item-description'
                        />
                        <input 
                            value={quantity} 
                            onChange={(e) => setQuantity(e.target.value)} 
                            placeholder='Quantity' 
                            type='number' 
                            min='1' 
                            step='0.01'
                            className='form-input'
                        />
                        <input 
                            value={unitPrice} 
                            onChange={(e) => setUnitPrice(e.target.value)} 
                            placeholder='Unit Price' 
                            type='number' 
                            min='0' 
                            step='0.01'
                            className='form-input'
                        />
                        <button onClick={addLineItem} className='add-item-btn' type='button'>
                            <i className="fa-solid fa-plus"></i> Add Item
                        </button>
                    </div>
                </div>
            </div>

            {/* Line Items Table */}
            {lineItems.length > 0 && (
                <div className='form-section'>
                    <div className='line-items-table'>
                        <table className='items-table'>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lineItems.map((item) => (
                                    <tr key={item.id}>
                                        <td>{item.description}</td>
                                        <td>{item.quantity}</td>
                                        <td>${item.unitPrice.toFixed(2)}</td>
                                        <td>${item.total.toFixed(2)}</td>
                                        <td>
                                            <button 
                                                onClick={() => removeLineItem(item.id)} 
                                                className='remove-item-btn'
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tax and Discount */}
            {lineItems.length > 0 && (
                <div className='form-section'>
                    <h3 className='section-title'>
                        <i className="fa-solid fa-calculator"></i> Tax & Discount
                    </h3>
                    <div className='tax-discount-grid'>
                        <div className='tax-section'>
                            <label>Tax</label>
                            <div className='input-group'>
                                <select 
                                    value={taxType} 
                                    onChange={(e) => setTaxType(e.target.value)}
                                    className='form-select'
                                >
                                    <option value='percentage'>%</option>
                                    <option value='fixed'>$</option>
                                </select>
                                <input 
                                    value={taxValue} 
                                    onChange={(e) => setTaxValue(e.target.value)} 
                                    placeholder='0' 
                                    type='number' 
                                    min='0' 
                                    step='0.01'
                                    className='form-input'
                                />
                            </div>
                        </div>
                        
                        <div className='discount-section'>
                            <label>Discount</label>
                            <div className='input-group'>
                                <select 
                                    value={discountType} 
                                    onChange={(e) => setDiscountType(e.target.value)}
                                    className='form-select'
                                >
                                    <option value='percentage'>%</option>
                                    <option value='fixed'>$</option>
                                </select>
                                <input 
                                    value={discountValue} 
                                    onChange={(e) => setDiscountValue(e.target.value)} 
                                    placeholder='0' 
                                    type='number' 
                                    min='0' 
                                    step='0.01'
                                    className='form-input'
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Totals Summary */}
            {lineItems.length > 0 && (
                <div className='form-section'>
                    <div className='totals-summary'>
                        <div className='totals-row'>
                            <span>Subtotal:</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        {taxValue > 0 && (
                            <div className='totals-row'>
                                <span>Tax ({taxType === 'percentage' ? `${taxValue}%` : `$${taxValue}`}):</span>
                                <span>${(taxType === 'percentage' ? (subtotal * taxValue / 100) : parseFloat(taxValue)).toFixed(2)}</span>
                            </div>
                        )}
                        {discountValue > 0 && (
                            <div className='totals-row'>
                                <span>Discount ({discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`}):</span>
                                <span>-${(discountType === 'percentage' ? (subtotal * discountValue / 100) : parseFloat(discountValue)).toFixed(2)}</span>
                            </div>
                        )}
                        <div className='totals-row total-final'>
                            <span><strong>Total:</strong></span>
                            <span><strong>${total.toFixed(2)}</strong></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NewInvoice