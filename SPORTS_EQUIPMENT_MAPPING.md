# Sports & Equipment Management System - Database & UI Mapping

## 📊 **Database Schema Relationships**

### **Core Tables & Relationships**

```sql
-- Sports Table
CREATE TABLE sports (
  _id ObjectId PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  equipmentTypes JSON, -- Array of equipment type strings
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Table (NEW)
CREATE TABLE equipment (
  _id ObjectId PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sport ObjectId REFERENCES sports(_id), -- Foreign Key to Sports
  category VARCHAR(100) NOT NULL, -- e.g., "Ball", "Bat", "Shoes"
  description TEXT,
  totalStock INTEGER DEFAULT 0,
  availableStock INTEGER DEFAULT 0,
  status ENUM('active', 'discontinued', 'out_of_stock') DEFAULT 'active',
  specifications JSON, -- Flexible specs for different equipment
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, sport) -- Equipment names unique per sport
);

-- Brands Table
CREATE TABLE brands (
  _id ObjectId PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  logoUrl VARCHAR(500) NOT NULL,
  associatedSports ObjectId[] REFERENCES sports(_id), -- Many-to-many with Sports
  isPublished BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table (UPDATED)
CREATE TABLE products (
  _id ObjectId PRIMARY KEY,
  sport ObjectId REFERENCES sports(_id), -- Foreign Key to Sports
  equipment ObjectId REFERENCES equipment(_id), -- Foreign Key to Equipment
  brand ObjectId REFERENCES brands(_id), -- Foreign Key to Brands
  price DECIMAL(10,2) NOT NULL,
  specifications JSON,
  images JSON, -- Array of image URLs
  stock INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Category Schemas (for dynamic forms)
CREATE TABLE category_schemas (
  _id ObjectId PRIMARY KEY,
  equipmentType VARCHAR(255) UNIQUE NOT NULL,
  fields JSON -- Array of field definitions for dynamic forms
);
```

## 🔗 **Relationship Flow**

```
Sports (1) ──── (M) Equipment (1) ──── (M) Products
   │                     │                     │
   └─ (M) Brands         └─ Belongs to Sport   └─ Uses Equipment
       (Many-to-Many)
```

### **Data Flow Example:**
1. **Sport**: "Cricket"
2. **Equipment**: "Cricket Bat" (belongs to Cricket sport)
3. **Product**: "SG Cricket Bat - Size 6" (uses Cricket Bat equipment, from SG brand)

## 🎨 **UI/UX Design Recommendations**

### **Sports Module - Card/Grid Layout**
```tsx
// Visual card layout for sports categories
<SportsGrid>
  {sports.map(sport => (
    <SportCard key={sport._id}>
      <SportIcon>{sport.icon}</SportIcon>
      <SportName>{sport.name}</SportName>
      <EquipmentCount>{sport.equipmentTypes.length} equipment types</EquipmentCount>
      <ActionButtons>
        <EditButton />
        <ViewEquipmentButton />
      </ActionButtons>
    </SportCard>
  ))}
</SportsGrid>
```

### **Equipment Module - Data Table with Status Badges**
```tsx
// Table layout for equipment inventory
<EquipmentTable>
  <thead>
    <tr>
      <th>Name</th>
      <th>Sport</th>
      <th>Category</th>
      <th>Stock</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {equipment.map(item => (
      <tr key={item._id}>
        <td>{item.name}</td>
        <td>{item.sport.name}</td>
        <td>{item.category}</td>
        <td>{item.availableStock}/{item.totalStock}</td>
        <td>
          <StatusBadge status={item.status}>
            {item.status.replace('_', ' ')}
          </StatusBadge>
        </td>
        <td>
          <ActionButtons>
            <EditButton />
            <DeleteButton />
          </ActionButtons>
        </td>
      </tr>
    ))}
  </tbody>
</EquipmentTable>
```

### **Dashboard Layout - Two-Pane Design**
```tsx
<DashboardLayout>
  <Sidebar>
    <Navigation>
      <NavItem icon="🏆" label="Sports" />
      <NavItem icon="⚽" label="Equipment" />
      <NavItem icon="🏷️" label="Brands" />
      <NavItem icon="📦" label="Products" />
    </Navigation>
  </Sidebar>

  <MainContent>
    <Header>
      <Title>Sports & Equipment Management</Title>
      <ActionBar>
        <AddButton />
        <FilterDropdown />
      </ActionBar>
    </Header>

    <ContentGrid>
      <LeftPane>
        <SportsCategories />
      </LeftPane>
      <RightPane>
        <EquipmentInventory />
      </RightPane>
    </ContentGrid>
  </MainContent>
</DashboardLayout>
```

## 🚀 **API Endpoints Mapping**

### **Sports APIs**
- `GET /api/sports` - List all sports
- `POST /api/sports` - Create sport
- `PUT /api/sports/[id]` - Update sport
- `DELETE /api/sports/[id]` - Delete sport

### **Equipment APIs (NEW)**
- `GET /api/equipment?sportId={id}` - List equipment (filter by sport)
- `POST /api/equipment` - Create equipment
- `PUT /api/equipment/[id]` - Update equipment
- `DELETE /api/equipment/[id]` - Delete equipment

### **Products APIs (UPDATED)**
- `GET /api/products?sport={id}&equipment={id}` - List products with filters
- `POST /api/products` - Create product (now uses ObjectIds)
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

## 📱 **Mobile-First Responsive Design**

### **Sports Cards - Mobile Optimized**
- **Desktop**: 4-column grid
- **Tablet**: 2-column grid
- **Mobile**: Single column with stacked cards

### **Equipment Table - Responsive**
- **Desktop**: Full data table
- **Tablet**: Condensed table with hidden columns
- **Mobile**: Card layout with key info only

## 🎯 **Key Features to Implement**

1. **Sports Management**
   - CRUD operations for sports
   - Equipment type management per sport
   - Visual card-based interface

2. **Equipment Inventory**
   - Stock tracking (total vs available)
   - Status management (active/discontinued/out_of_stock)
   - Sport-based filtering
   - Bulk operations

3. **Brand Integration**
   - Link brands to multiple sports
   - Filter products by brand + sport + equipment

4. **Product Creation Flow**
   - Step 1: Select Sport
   - Step 2: Select Equipment (filtered by sport)
   - Step 3: Select Brand (filtered by sport)
   - Step 4: Dynamic form based on equipment type

## 🔄 **Migration Strategy**

### **Current Issues:**
- Products use string references instead of ObjectIds
- No dedicated Equipment table
- Equipment types stored as arrays in Sports

### **Migration Steps:**
1. Create Equipment table with proper relationships
2. Migrate existing equipment strings to Equipment records
3. Update Product model to use ObjectId references
4. Update APIs to work with new relationships
5. Update frontend to use new data structure

This architecture provides a scalable, maintainable system for managing sports equipment inventory with proper relationships and an intuitive user interface.</content>
<parameter name="filePath">c:\Users\shashika\Desktop\ecommerce\SPORTS_EQUIPMENT_MAPPING.md