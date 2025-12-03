# Customer Payments - Bulk Import Instructions

## Import Options

The Customer Payment & Invoice Details page supports two ways to import bulk data:

### 1. Excel/XLSX File Import
- Click the **Import** button
- Select **Upload XLSX File**
- Choose your Excel file (.xlsx or .xls format)
- Data will be automatically imported

### 2. Google Sheets Import
- Click the **Import** button
- Select **Import from Google Sheets**
- Paste the URL of your Google Sheet
- **Important**: Make sure your Google Sheet is publicly accessible (Anyone with the link can view)
- Click Import

## Excel Template Format

Download the template by clicking **Import → Download Template**

Required columns:
- **Customer Email**: Email address of the customer
- **Month**: Format YYYY-MM (e.g., 2024-12)
- **Vendor ID**: Vendor identifier (e.g., vendor-dataimpulse)
- **Vendor Name**: Display name of the vendor
- **Service**: Service type (e.g., Residential Proxy, Mobile Proxy)
- **Opening Balance**: Starting data balance in GB
- **Data Added**: Amount of data added in GB
- **Closing Balance**: Ending data balance in GB
- **Invoice No**: Invoice number (e.g., INV-001)
- **Invoice Date**: Date in YYYY-MM-DD format
- **Invoice Amount**: Amount in dollars
- **Payment Status**: pending, paid, or overdue

## Google Sheets Setup

1. Create a Google Sheet with the same columns as the template
2. Make sure the first row contains the column headers
3. Share the sheet:
   - Click **Share** button
   - Change to "Anyone with the link"
   - Set permission to "Viewer"
4. Copy the sheet URL
5. Paste it in the import dialog

## Export Data

Click the **Export** button to download current data as an Excel file.

## Features

### Data Table Features:
- ✅ **Sortable columns**: Click on column headers to sort
- ✅ **Filtering**: Use dropdowns to filter by customer, vendor, and service
- ✅ **Pagination**: Navigate through pages with customizable rows per page
- ✅ **Search-friendly**: All data is searchable

### Admin Features:
- Add/Edit individual records
- Bulk import from XLSX files
- Bulk import from Google Sheets
- Export data to Excel
- Download import template
- Filter by customer

### Customer Features:
- View their own payment records
- Filter by vendor and service
- Export their data
- Sort and search records

## Notes

- All imported data is validated before adding to the database
- Duplicate records (same customer + month + vendor + service) may be rejected
- Invalid data rows will be skipped with appropriate error messages
- Always download and check the template format before creating your import file
