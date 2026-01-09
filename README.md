# Pottu Pachaiyapan Catering & Sweets - Order Management System

A comprehensive and modern web application for managing customer orders, products, and analytics for a sweet and karam shop. Built with a Swiggy/Zomato-like ordering experience and detailed reporting features.

## Features

### 🔐 Authentication
- Secure login page with beautiful split-screen design
- Shop name branding on login page
- Session-based authentication
- Automatic logout on browser close

### 📊 Dashboard
- **Real-time Statistics**:
  - Orders this week
  - Delivered revenue (only from delivered orders)
  - To deliver amount (pending orders)
  - Total orders count
  - Delivered orders count
  - Pending orders count
  - Total customers
  
- **Analytics**:
  - Average order value
  - Today's orders
  - Today's revenue (delivered only)
  - Completion rate percentage

- **Highest Order Display**:
  - Shows the highest priced order with:
    - Customer name
    - Order ID
    - All products purchased with quantities
    - Total amount
    - Order and delivery dates
    - Delivery status

- **Recent Orders**: Last 5 orders displayed with full details

- **Quick Actions**:
  - Manage Products
  - Take New Order
  - View All Orders
  - Download PDF reports

### 🛍️ Product Management
- Add/Edit/Delete sweets and karam items
- Set prices for each product
- Products stored in localStorage
- Supports multiple quantity options (1/4 kg, 1/2 kg, 3/4 kg, 1 kg)

### 🛒 Ordering Page (Swiggy/Zomato Style)
- Grid layout displaying products (3-4 per row)
- Search functionality to find products quickly
- Product cards showing name and price per kg
- Quantity selection: 1/4 kg, 1/2 kg, 3/4 kg, 1 kg
- Multiple quantity counts per product
- Shopping cart with:
  - Product list
  - Quantities and counts
  - Individual item totals
  - Grand total
- Checkout process:
  - Customer name input
  - Order date selection
  - Delivery date selection
  - Order confirmation
- Real-time price calculation based on selected quantities

### 📋 Order Details Page
- **Three Tabs**:
  - **To Deliver Orders**: Pending orders grouped by delivery date
  - **All Orders**: Complete order history
  - **Delivered Orders**: Orders marked as delivered
  
- **Order Management**:
  - Mark orders as delivered (updates timestamp)
  - Cancel orders (removes from system)
  - Orders grouped by delivery date
  - Order count badges per delivery date
  - Status badges (Delivered/Pending)
  
- **Search & Filter**:
  - Search by customer name or product
  - Filter by date (Today, This Week, All Dates)
  
- **Order Information Display**:
  - Customer name and order ID
  - Complete product list with quantities and prices
  - Order date, delivery date, and delivered date (if applicable)
  - Total amount
  - Delivery status

### 📄 PDF Reports
- **Download Options**:
  - All Orders Report
  - Today's Delivered Orders Report
  - Orders by Specific Date Report
  
- **PDF Contents**:
  - Shop header with name
  - Report title and generation timestamp
  - Summary statistics:
    - Total orders
    - Delivered/Pending counts
    - Total revenue
    - Delivered revenue
  - Orders grouped by delivery date
  - Complete order details:
    - Customer information
    - Product list with quantities and prices
    - Order dates and delivery status
  - **Customer Purchase Summary**:
    - Customer name
    - Delivery status (All Delivered / Partially Delivered / Pending)
    - Total orders count
    - Amount received (from delivered orders)
    - Amount pending (from pending orders)

### 🔍 Smart Filtering
- Automatic exclusion of cancelled/zero-amount orders
- Zero-amount orders are filtered out from:
  - Dashboard statistics
  - Order lists
  - PDF reports
  - Analytics calculations

## Login Credentials

- **Username**: `one`
- **Password**: `1234`

## How to Use

### Initial Setup
1. Open `index.html` in a web browser
2. Login with the credentials above
3. You'll be redirected to the Dashboard

### Adding Products
1. Click "Manage Products" from Dashboard or Quick Actions
2. Click "Add New Product"
3. Enter product name and price per kg
4. Select category (Sweet/Karam)
5. Click "Add Product"
6. Products will be available in the Ordering page

### Taking Orders
1. Click "Take New Order" from Dashboard
2. Browse products in the grid layout
3. Use search to find specific products
4. Click on a product card
5. Select quantity (1/4, 1/2, 3/4, or 1 kg)
6. Select count (number of items)
7. Product is added to cart automatically
8. Review cart on the right side
9. Click "Checkout" button
10. Fill in:
    - Customer name
    - Order date
    - Delivery date
11. Click "Place Order"
12. Order is saved and you're redirected to Dashboard

### Managing Orders
1. Click "View All Orders" from Dashboard
2. Switch between tabs:
   - **To Deliver**: See pending orders
   - **All Orders**: See complete history
   - **Delivered Orders**: See delivered orders only
3. Use search box to find specific orders
4. Use date filter dropdown to filter by time period
5. Click "Mark as Delivered" to update order status
6. Click "Cancel Order" to remove an order
7. Orders are automatically grouped by delivery date

### Viewing Analytics
1. Dashboard shows all statistics automatically
2. Statistics update in real-time as orders are added/updated
3. Recent orders section shows latest 5 orders
4. Highest order section shows the order with maximum value

### Downloading Reports
1. From Dashboard or Order Details page, click:
   - "Download All Orders PDF" for complete report
   - "Download Today's Delivered PDF" for today's deliveries
   - "Download By Date PDF" (Order Details page only) and enter a date
2. PDF will be generated and downloaded automatically
3. PDF includes:
   - Complete order details
   - Customer purchase summaries
   - Status information (delivered/pending amounts)

## File Structure

```
Food Order/
├── index.html              # Login page
├── dashboard.html          # Main dashboard with statistics
├── products.html           # Product management page
├── ordering.html           # Ordering page (Swiggy/Zomato style)
├── orderdetails.html       # Order details page with tabs
├── styles.css              # All styling (responsive design)
├── login.js                # Login functionality
├── dashboard.js            # Dashboard statistics and PDF generation
├── products.js             # Product management functionality
├── ordering.js             # Ordering page and cart functionality
├── orderdetails.js         # Order details display and management
└── README.md              # This file
```

## Technologies Used

- **HTML5**: Modern semantic markup
- **CSS3**: 
  - Flexbox and Grid layouts
  - Gradients and animations
  - Responsive design
  - Mobile-first approach
- **Vanilla JavaScript**: 
  - ES6+ features
  - LocalStorage API
  - SessionStorage API
  - jsPDF library for PDF generation
- **Libraries**:
  - jsPDF 2.5.1 (for PDF generation)

## Browser Compatibility

Works on all modern browsers:
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Opera

## Key Features & Notes

### Data Storage
- **Orders**: Stored in `localStorage` - persists between browser sessions
- **Products**: Stored in `localStorage` - persists between browser sessions
- **Authentication**: Stored in `sessionStorage` - cleared when browser closes
- Data is local to each browser/device

### Order Status
- **Pending**: Orders that haven't been delivered yet
- **Delivered**: Orders marked as delivered with delivery timestamp
- **Cancelled**: Orders removed from the system (won't appear in lists)

### Revenue Calculation
- **Delivered Revenue**: Only counts orders with status "Delivered"
- **To Deliver Amount**: Sum of all pending order amounts
- Revenue increases only when orders are marked as delivered

### Filtering & Exclusion
- Orders with ₹0 amount are automatically excluded from:
  - Dashboard statistics
  - Order lists
  - PDF reports
  - Analytics calculations

### Responsive Design
- Desktop: Full layout with sidebars and grids
- Tablet: Adjusted layout for medium screens
- Mobile: Stacked vertical layout, touch-friendly buttons

## Future Enhancements

Potential features that could be added:
- Export to Excel/CSV
- Print functionality
- Customer history search
- Product categories and subcategories
- Discount/coupon system
- Payment status tracking
- Inventory management
- Multi-user support with different roles

## Support

For issues or questions, please check:
1. Browser console for any JavaScript errors
2. LocalStorage data in browser DevTools
3. Ensure all files are in the same directory
4. Check browser compatibility

## License

This project is developed for Pottu Pachaiyapan Catering & Sweets.

---

**Version**: 2.0  
**Last Updated**: 2024  
**Developer**: Built with modern web technologies
