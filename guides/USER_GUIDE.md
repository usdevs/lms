# Loan Management System (LMS) - User Guide

This guide provides comprehensive instructions for using the Loan Management System to manage inventory items, process loan requests, and manage users.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Navigation](#navigation)
3. [Catalogue Management](#catalogue-management)
   - [Viewing Items](#viewing-items)
   - [Adding Items](#adding-items)
   - [Editing Items](#editing-items)
   - [Deleting Items](#deleting-items)
   - [Understanding Item Types](#understanding-item-types)
4. [Loan Management](#loan-management)
   - [Viewing Loans](#viewing-loans)
   - [Creating a Loan Request](#creating-a-loan-request)
   - [Approving/Rejecting Loans](#approvingrejectingloans)
   - [Returning Items](#returning-items)
   - [Understanding Loan Statuses](#understanding-loan-statuses)
5. [User Management](#user-management)
   - [Viewing Users](#viewing-users)
   - [Adding Users](#adding-users)
   - [Editing Users](#editing-users)
   - [Deleting Users](#deleting-users)
   - [Managing Groups](#managing-groups)
6. [Key Concepts](#key-concepts)
   - [Roles](#roles)
   - [Inventory Holders (IH)](#inventory-holders-ih)
   - [Storage Locations (SLOC)](#storage-locations-sloc)
   - [Quantity Tracking](#quantity-tracking)

---

## Getting Started

The Loan Management System (LMS) is a web-based application for managing inventory items and loan requests. Access the system through your web browser at the provided URL.

Upon loading, you'll be redirected to the **Catalogue** page by default.

---

## Navigation

The system has three main sections accessible via the top navigation bar:

| Tab | Description |
|-----|-------------|
| **CATALOGUE** | View and manage all inventory items |
| **LOANS** | Process and track loan requests |
| **USERS** | Manage users and groups |

Click on any tab to navigate to that section. The active tab is highlighted with a blue underline.

---

## Catalogue Management

The Catalogue is where all inventory items are stored and managed.

### Viewing Items

The catalogue displays items in a grid layout with the following information for each item:

- **Image** - Visual representation of the item (or "No Image" placeholder)
- **Description** - Name/description of the item
- **Location** - Storage location (SLOC)
- **Inventory Holder** - Person/group responsible for the item
- **Quantity** - Available quantity vs total quantity (e.g., "5 / 10 available")
- **Type Badges** - Special indicators for unloanable or expendable items

#### Searching and Filtering

Use the following controls to find items:

| Control | Function |
|---------|----------|
| **Search bar** | Search by item description, ID, or location. Press Enter or click away to search. |
| **Location dropdown** | Filter by storage location |
| **Holder dropdown** | Filter by inventory holder |
| **Sort dropdown** | Sort by Item Name, Quantity, or ID |
| **▲/▼ button** | Toggle ascending/descending order |
| **Reset Filters** | Clear all filters (appears when filters are active) |

The catalogue uses **infinite scroll** - simply scroll down to load more items automatically.

### Adding Items

1. Click the **"+ Add Item"** button (orange) in the top-right corner
2. Fill in the required fields:
   - **Description** * - Name of the item
   - **Quantity** * - Total quantity available
   - **Unit of Measure** * - e.g., "pcs", "kg", "m"
   - **Storage Location** * - Select existing or create new
   - **Inventory Holder** * - Person/group responsible
3. Optionally fill in:
   - **Purchase Date** - When the item was acquired
   - **RFP Number** - Reference/purchase order number
   - **Item Image** - Upload a photo (drag & drop or click to browse)
   - **Remarks** - Additional notes
   - **Unloanable** - Check if item cannot be loaned
   - **Expendable** - Check if item is consumed when loaned
4. Click **"Add Item"** to save

*Fields marked with * are required*

#### Creating a New Storage Location

When adding/editing an item, you can create a new storage location on the fly:

1. In the Storage Location dropdown, select **"+ Create new location"**
2. Enter the new location name
3. The location will be created when you save the item

### Editing Items

1. Hover over an item card to reveal action buttons
2. Click the **pencil icon** (✏️) to edit
3. Modify the desired fields
4. Click **"Update Item"** to save changes

### Deleting Items

1. Hover over an item card to reveal action buttons
2. Click the **trash icon** (🗑️)
3. Confirm the deletion in the dialog

> **Note:** Items with active loans cannot be deleted.

### Understanding Item Types

| Type | Badge | Behavior |
|------|-------|----------|
| **Normal** | (none) | Can be loaned and returned. Quantity remains constant. |
| **Unloanable** | 🚫 Red "Unloanable" | Cannot be included in loan requests |
| **Expendable** | 📦 Amber "Expendable" | Consumed when loaned - quantity decreases on approval, items are not returned |

---

## Loan Management

The Loans section handles all loan requests from creation to completion.

### Viewing Loans

The loans table displays all loan requests with:

- **Ref No** - Unique reference number (e.g., #123)
- **Requester** - Name and Telegram handle of the person requesting
- **Items** - Summary of items being loaned (shows up to 2 items, "+X more" if additional)
- **Period** - Start and end dates of the loan
- **Status** - Current loan status (see [Understanding Loan Statuses](#understanding-loan-statuses))

#### Filtering and Searching

- **Search bar** - Search by requester name, Telegram handle, reference number, or item name
- **Status filters** - Click status buttons (All, Pending, Ongoing, Completed, Rejected) to filter

#### Viewing Loan Details

Click on any row in the loans table to open the detailed view, which shows:

- Full requester information
- Complete loan period with overdue indicator if applicable
- All items in the loan with quantities and individual statuses
- Available actions based on loan status

### Creating a Loan Request

1. Click **"+ New Request"** button (orange)
2. **Select or Create Requester:**
   - Search for an existing user, OR
   - Select "Create new requester" and fill in their details:
     - First Name *
     - Last Name
     - NUSNET ID
     - Telegram Handle *
3. **Set Loan Details:**
   - Start Date - When the loan begins
   - End Date - When items should be returned
   - Organisation (optional) - e.g., "Freshman Orientation Project"
4. **Add Items:**
   - Use the item search to find items
   - Click an item to add it to the loan
   - Adjust quantities as needed (up to the total quantity available)
   - Remove items using the trash icon
5. Click **"Confirm Loan"**

Upon success, you'll see a confirmation screen with the reference number. You can:
- Click **"Create Another"** to create a new loan
- Close the dialog to return to the loans list

> **Note:** You can request up to the **total quantity** of an item. Availability is checked at approval time.

### Approving/Rejecting Loans

Only **Pending** loans can be approved or rejected.

#### To Approve a Loan:

1. Click on the pending loan to open details
2. Review the items and quantities
3. If sufficient stock is available (shown in green), click **"Approve Loan"**
4. Available will be deducted and the loan status changes to **Ongoing**

> **Warning:** If any item has insufficient stock, you'll see a red warning and the Approve button will be disabled. You must reject the loan or wait for items to be returned.

#### To Reject a Loan:

1. Click on the pending loan to open details
2. Click **"Reject"**
3. Confirm the rejection
4. The loan status changes to **Rejected**

### Returning Items

For **Ongoing** loans, you can mark individual items as returned:

1. Click on the ongoing loan to open details
2. Find the item to return in the items table
3. Click the **"Return"** button next to that item
4. The item status changes to **Returned** (or **Returned Late** if past the end date)

When all items are returned, the loan status automatically changes to **Completed**.

### Editing Pending Loans

Only **Pending** loans can be edited:

1. In the loans table, find the pending loan
2. Click the **pencil icon** (✏️) in the Actions column
3. Modify dates, organisation, or items as needed
4. Click **"Save Changes"**

### Deleting Pending Loans

Only **Pending** loans can be deleted:

1. In the loans table, find the pending loan
2. Click the **trash icon** (🗑️) in the Actions column
3. Confirm the deletion

### Understanding Loan Statuses

| Status | Color | Description |
|--------|-------|-------------|
| **Pending** | 🟡 Yellow | Awaiting approval. Can be edited, approved, rejected, or deleted. |
| **Ongoing** | 🔵 Blue | Approved and active. Items are on loan. Can mark items as returned. |
| **Completed** | 🟢 Green | All items returned. No further actions available. |
| **Rejected** | 🔴 Red | Loan was rejected. No further actions available. |

#### Individual Item Statuses

| Status | Description |
|--------|-------------|
| **Pending** | Item awaiting loan approval |
| **On Loan** | Item is currently out on loan |
| **Returned** | Item was returned on time |
| **Returned Late** | Item was returned after the loan end date |
| **Rejected** | Loan containing this item was rejected |

---

## User Management

The Users section allows you to manage system users and organize them into groups.

### View Modes

Toggle between two views using the buttons at the top:

- **Individual** - Shows all users in a table format
- **Groups** - Shows users organized by their group memberships

### Viewing Users

The users table displays:

- **Name** - Full name
- **Telegram** - Telegram handle (with @ prefix)
- **NUSNET** - NUSNET ID (if provided)
- **Role** - User's system role
- **Groups** - Groups the user belongs to

### Adding Users

1. Click **"+ Add User"** button
2. Fill in required fields:
   - **First Name** *
   - **Telegram Handle** *
3. Fill in optional fields:
   - **Last Name**
   - **NUSNET ID**
   - **Role** - Select from dropdown
   - **Groups** - Add user to one or more groups.
                  You can create a new group in-line if necessary.
4. Click **"Add User"**

### Editing Users

1. Find the user in the table
2. Click the **pencil icon** (✏️) in the Actions column
3. Modify the desired fields
4. Click **"Save Changes"**

### Deleting Users

1. Find the user in the table
2. Click the **trash icon** (🗑️) in the Actions column
3. Confirm the deletion

> **Note:** Users cannot be deleted if they:
> - Have loan history (requested or handled loans)
> - Are the inventory holder for any items

### Managing Groups

Switch to the **Groups** view to manage group memberships.

#### Viewing Group Members

1. Click on a group row to expand it
2. View all members with their details
3. Primary POC (Point of Contact) is indicated with a ⭐ star badge

#### Adding Members to a Group

1. Expand the group
2. Click **"+ Add Member"**
3. Search for and select a user
4. The user is added to the group

#### Setting Primary POC

1. Expand the group
2. Find the member you want to make primary
3. Click the **star icon** (⭐) next to their name
4. They become the Primary POC (shown on items held by this group)

#### Removing Members from a Group

1. Expand the group
2. Find the member to remove
3. Click the **remove icon** (person with minus)
4. Confirm the removal

> **Note:** Removing from a group does not delete the user.

---

## Other notes

### Quantity Tracking

The system tracks two quantities for each item:

| Quantity | Description |
|----------|-------------|
| **Total** | The total number of physical items owned |
| **Available** | Items not currently on loan (Total - On Loan) |

For **Normal Items:**
- Total quantity never changes automatically
- Available = Total - (items currently on loan)
- When items are returned, available quantity increases

For **Expendable Items:**
- Total quantity decreases when loans are approved (items are consumed)
- Available = Current stock remaining
- Items are not returned

**Quantity at Different Stages:**

| Stage | Effect on Quantity |
|-------|-------------------|
| Loan Created (Pending) | No change - pending loans don't reserve stock |
| Loan Approved | Available decreases. For expendable items, Total also decreases. |
| Item Returned | Available increases (normal items only) |
| Loan Rejected | No change |

---

## Troubleshooting

### "Cannot approve loan - insufficient stock"
Some items in the loan request are no longer available. Either:
- Wait for items to be returned from other loans
- Reject the loan and ask the requester to modify their request

### "Cannot delete user"
The user has loan history or is an inventory holder. You can:
- Reassign items to a different inventory holder
- Keep the user in the system (historical data is preserved)

### "Cannot delete item"
The item has active loans. Wait for all loans to be completed or rejected.

### Images not uploading
- Check file size (should be <10MB)
- Ensure the file is a valid image format (JPEG, PNG, GIF, WebP)
