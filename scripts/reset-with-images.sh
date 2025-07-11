#!/bin/bash

# Reset database and seed with posts that have images
echo "Resetting database and seeding with image-enabled posts..."

# Create uploads directory if it doesn't exist
mkdir -p uploads/images

# Copy sample images from Angular public folder to uploads folder
echo "Copying sample images to uploads folder..."
cp app/cmd/web/public/images/blog-sample-images/*.jpg uploads/images/

# Rename the copied images with simpler names for easier database seeding
cd uploads/images/
mv 1f58585d-5b41-11f0-94fc-0ee2f07aa6aa_products_master_py_u4_inf_.jpg blog_1_featured.jpg 2>/dev/null || true
mv 27de4c1c-5b3d-11f0-94fc-0ee2f07aa6aa_products_master_py_u4_inf_.jpg blog_2_featured.jpg 2>/dev/null || true
mv 43ec40f5-5b41-11f0-94fc-0ee2f07aa6aa_products_master_py_u4_inf_.jpg blog_3_featured.jpg 2>/dev/null || true
mv 4f2b103c-5b41-11f0-94fc-0ee2f07aa6aa_products_master_py_u4_inf_.jpg blog_4_featured.jpg 2>/dev/null || true
mv adfee1c7-5b38-11f0-94fc-0ee2f07aa6aa_products_master_py_u4_inf_.jpg blog_5_featured.jpg 2>/dev/null || true
mv f127f985-5b40-11f0-94fc-0ee2f07aa6aa_products_master_py_u4_inf_.jpg blog_6_featured.jpg 2>/dev/null || true
cd ../..

echo "Images copied and renamed successfully!"

# Connect to database and reset data
PGPASSWORD=pa55word psql -h localhost -p 5435 -U technoprise -d technoprise << 'EOF'

-- Clear existing data
DELETE FROM images;
DELETE FROM posts;

-- Reset sequences
ALTER SEQUENCE posts_id_seq RESTART WITH 1;
ALTER SEQUENCE images_id_seq RESTART WITH 1;

-- Insert new posts with better content
INSERT INTO posts (title, slug, content, excerpt, published_at, created_at, updated_at, version) VALUES 
(
    'Welcome to Technoprise Blog',
    'welcome-to-technoprise',
    E'# Welcome to Our Technology Blog\n\nWelcome to the Technoprise blog platform! This is where we share insights, tutorials, and innovations in the world of technology.\n\n## What You\'ll Find Here\n\n- **Technical Tutorials**: Step-by-step guides for developers\n- **Industry Insights**: Analysis of the latest tech trends\n- **Best Practices**: Proven methodologies for software development\n- **Innovation Stories**: How we solve complex technical challenges\n\n## Our Mission\n\nAt Technoprise, we believe in making technology accessible and understandable. Our blog serves as a platform to share knowledge and help developers at all levels grow their skills.\n\n### Featured Topics\n\n1. **Web Development**: Modern frameworks and best practices\n2. **Database Design**: Scalable and efficient data architecture\n3. **API Development**: RESTful services and microservices\n4. **Cloud Computing**: Deployment and infrastructure strategies\n\nStay tuned for more exciting content!',
    'Welcome to our technology blog platform where we share insights, tutorials, and innovations in software development.',
    '2024-01-01 10:00:00',
    NOW(),
    NOW(),
    1
),
(
    'Getting Started with Go APIs',
    'getting-started-go-apis',
    E'# Building Robust APIs with Go\n\nGo has become one of the most popular languages for building APIs due to its simplicity, performance, and excellent standard library.\n\n## Why Choose Go for APIs?\n\n- **Performance**: Compiled language with excellent runtime performance\n- **Concurrency**: Built-in support for concurrent programming\n- **Standard Library**: Rich HTTP package and JSON handling\n- **Static Typing**: Catch errors at compile time\n\n## Setting Up Your First API\n\n```go\npackage main\n\nimport (\n    "encoding/json"\n    "net/http"\n    "log"\n)\n\ntype Response struct {\n    Message string `json:"message"`\n    Status  string `json:"status"`\n}\n\nfunc healthHandler(w http.ResponseWriter, r *http.Request) {\n    response := Response{\n        Message: "API is running!",\n        Status:  "success",\n    }\n    \n    w.Header().Set("Content-Type", "application/json")\n    json.NewEncoder(w).Encode(response)\n}\n\nfunc main() {\n    http.HandleFunc("/health", healthHandler)\n    log.Println("Server starting on :8080")\n    log.Fatal(http.ListenAndServe(":8080", nil))\n}\n```\n\n## Best Practices\n\n1. **Error Handling**: Always handle errors gracefully\n2. **Middleware**: Use middleware for cross-cutting concerns\n3. **Validation**: Validate input data thoroughly\n4. **Documentation**: Keep your API well-documented\n\nThis is just the beginning of your Go API journey!',
    'Learn how to build robust and scalable APIs using Go programming language with practical examples and best practices.',
    '2024-01-02 14:30:00',
    NOW(),
    NOW(),
    1
),
(
    'Database Design Best Practices',
    'database-design-best-practices',
    E'# Essential Database Design Principles\n\nProper database design is the foundation of any successful application. Here are the key principles every developer should know.\n\n## Normalization Fundamentals\n\nNormalization helps eliminate data redundancy and ensures data integrity:\n\n### First Normal Form (1NF)\n- Each column contains atomic values\n- No repeating groups in rows\n- Each row is unique\n\n### Second Normal Form (2NF)\n- Must be in 1NF\n- All non-key attributes depend on the entire primary key\n- Eliminate partial dependencies\n\n### Third Normal Form (3NF)\n- Must be in 2NF\n- No transitive dependencies\n- Non-key attributes depend only on primary key\n\n## Indexing Strategy\n\n```sql\n-- Primary key index (automatic)\nCREATE TABLE users (\n    id SERIAL PRIMARY KEY,\n    email VARCHAR(255) UNIQUE NOT NULL,\n    created_at TIMESTAMP DEFAULT NOW()\n);\n\n-- Additional indexes for common queries\nCREATE INDEX idx_users_email ON users(email);\nCREATE INDEX idx_users_created_at ON users(created_at);\n```\n\n## Performance Considerations\n\n1. **Query Optimization**: Use EXPLAIN to analyze query plans\n2. **Connection Pooling**: Manage database connections efficiently\n3. **Caching**: Implement appropriate caching strategies\n4. **Monitoring**: Track query performance and bottlenecks\n\n## Common Pitfalls to Avoid\n\n- Over-normalization leading to complex joins\n- Missing indexes on frequently queried columns\n- Using VARCHAR(255) for everything\n- Ignoring database constraints\n\nRemember: good database design pays dividends throughout your application\'s lifecycle.',
    'Essential principles for designing efficient and scalable database schemas with practical examples and common pitfalls to avoid.',
    '2024-01-03 09:15:00',
    NOW(),
    NOW(),
    1
),
(
    'Modern Frontend Development',
    'modern-frontend-development',
    E'# The Evolution of Frontend Development\n\nFrontend development has transformed dramatically over the past few years. Let\'s explore the modern landscape and best practices.\n\n## Current Frontend Ecosystem\n\n### Popular Frameworks\n\n1. **React**: Component-based library with virtual DOM\n2. **Angular**: Full-featured framework with TypeScript\n3. **Vue.js**: Progressive framework with gentle learning curve\n4. **Svelte**: Compile-time framework with no runtime overhead\n\n### Development Tools\n\n```json\n{\n  "devDependencies": {\n    "vite": "^4.0.0",\n    "typescript": "^4.9.0",\n    "eslint": "^8.0.0",\n    "prettier": "^2.8.0",\n    "@testing-library/react": "^13.0.0"\n  }\n}\n```\n\n## TypeScript Adoption\n\nTypeScript has become essential for large applications:\n\n```typescript\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n  createdAt: Date;\n}\n\nconst fetchUser = async (id: number): Promise<User> => {\n  const response = await fetch(`/api/users/${id}`);\n  return response.json();\n};\n```\n\n## Component Architecture\n\n### Smart vs. Presentational Components\n\n- **Smart Components**: Handle business logic and state\n- **Presentational Components**: Focus on UI rendering\n\n### State Management Patterns\n\n1. **Local State**: useState, useReducer\n2. **Global State**: Redux, Zustand, Context API\n3. **Server State**: React Query, SWR\n\n## Modern CSS Approaches\n\n- **CSS-in-JS**: Styled-components, Emotion\n- **Utility-First**: Tailwind CSS\n- **CSS Modules**: Scoped styling\n- **Component Libraries**: Material-UI, Chakra UI\n\n## Performance Optimization\n\n1. **Code Splitting**: Dynamic imports for lazy loading\n2. **Tree Shaking**: Remove unused code\n3. **Bundle Analysis**: Webpack Bundle Analyzer\n4. **Caching Strategies**: Service workers and CDN\n\nThe frontend landscape continues to evolve rapidly, but these fundamentals will serve you well.',
    'Exploring the latest trends and best practices in modern frontend development including frameworks, tools, and architectural patterns.',
    '2024-01-04 16:45:00',
    NOW(),
    NOW(),
    1
),
(
    'Building Microservices with Docker',
    'building-microservices-docker',
    E'# Microservices Architecture with Docker\n\nMicroservices have revolutionized how we build and deploy applications. Docker makes it easier to develop, test, and deploy microservices.\n\n## What Are Microservices?\n\nMicroservices architecture breaks down applications into small, independent services that:\n\n- Run in their own processes\n- Communicate via well-defined APIs\n- Are organized around business capabilities\n- Can be deployed independently\n\n## Docker Fundamentals\n\n### Creating a Dockerfile\n\n```dockerfile\nFROM node:18-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm ci --only=production\n\nCOPY . .\n\nEXPOSE 3000\n\nUSER node\n\nCMD ["npm", "start"]\n```\n\n### Docker Compose for Local Development\n\n```yaml\nversion: "3.8"\n\nservices:\n  api:\n    build: .\n    ports:\n      - "3000:3000"\n    environment:\n      - DATABASE_URL=postgresql://user:pass@db:5432/myapp\n    depends_on:\n      - db\n      - redis\n\n  db:\n    image: postgres:15\n    environment:\n      POSTGRES_DB: myapp\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: pass\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\n\n  redis:\n    image: redis:7-alpine\n    ports:\n      - "6379:6379"\n\nvolumes:\n  postgres_data:\n```\n\n## Service Communication\n\n### Synchronous Communication\n- REST APIs\n- GraphQL\n- gRPC\n\n### Asynchronous Communication\n- Message queues (RabbitMQ, Apache Kafka)\n- Event streaming\n- Pub/Sub patterns\n\n## Best Practices\n\n1. **Single Responsibility**: Each service should have one business purpose\n2. **Database per Service**: Avoid shared databases\n3. **API Versioning**: Plan for API evolution\n4. **Health Checks**: Implement proper monitoring\n5. **Circuit Breakers**: Handle failures gracefully\n\n## Deployment Strategies\n\n- **Blue-Green Deployment**: Zero-downtime deployments\n- **Rolling Updates**: Gradual service updates\n- **Canary Releases**: Test with subset of traffic\n\nMicroservices with Docker provide a powerful foundation for scalable applications.',
    'Learn how to architect and deploy microservices using Docker containers with practical examples and deployment strategies.',
    '2024-01-05 11:20:00',
    NOW(),
    NOW(),
    1
),
(
    'Advanced React Patterns',
    'advanced-react-patterns',
    E'# Advanced React Patterns for Scalable Applications\n\nAs React applications grow in complexity, understanding advanced patterns becomes crucial for maintainability and performance.\n\n## Compound Components Pattern\n\nThis pattern allows you to create flexible and reusable component APIs:\n\n```jsx\nfunction Accordion({ children }) {\n  const [openIndex, setOpenIndex] = useState(null);\n  \n  return (\n    <div className="accordion">\n      {React.Children.map(children, (child, index) =>\n        React.cloneElement(child, {\n          isOpen: index === openIndex,\n          onToggle: () => setOpenIndex(index === openIndex ? null : index)\n        })\n      )}\n    </div>\n  );\n}\n\nfunction AccordionItem({ title, children, isOpen, onToggle }) {\n  return (\n    <div className="accordion-item">\n      <button onClick={onToggle}>{title}</button>\n      {isOpen && <div>{children}</div>}\n    </div>\n  );\n}\n```\n\n## Render Props Pattern\n\nShare code between components using a function prop:\n\n```jsx\nfunction DataFetcher({ url, render }) {\n  const [data, setData] = useState(null);\n  const [loading, setLoading] = useState(true);\n  \n  useEffect(() => {\n    fetch(url)\n      .then(res => res.json())\n      .then(data => {\n        setData(data);\n        setLoading(false);\n      });\n  }, [url]);\n  \n  return render({ data, loading });\n}\n\n// Usage\n<DataFetcher\n  url="/api/users"\n  render={({ data, loading }) => (\n    loading ? <div>Loading...</div> : <UserList users={data} />\n  )}\n/>\n```\n\n## Custom Hooks for Logic Reuse\n\n```jsx\nfunction useLocalStorage(key, initialValue) {\n  const [storedValue, setStoredValue] = useState(() => {\n    try {\n      const item = window.localStorage.getItem(key);\n      return item ? JSON.parse(item) : initialValue;\n    } catch (error) {\n      return initialValue;\n    }\n  });\n  \n  const setValue = (value) => {\n    try {\n      setStoredValue(value);\n      window.localStorage.setItem(key, JSON.stringify(value));\n    } catch (error) {\n      console.error(error);\n    }\n  };\n  \n  return [storedValue, setValue];\n}\n```\n\n## Performance Optimization\n\n### React.memo for Component Memoization\n```jsx\nconst ExpensiveComponent = React.memo(({ data, onClick }) => {\n  return (\n    <div onClick={onClick}>\n      {/* Expensive rendering logic */}\n    </div>\n  );\n});\n```\n\n### useMemo and useCallback\n```jsx\nfunction OptimizedComponent({ items, filter }) {\n  const filteredItems = useMemo(\n    () => items.filter(item => item.category === filter),\n    [items, filter]\n  );\n  \n  const handleClick = useCallback(\n    (id) => {\n      // Handle click logic\n    },\n    []\n  );\n  \n  return (\n    <div>\n      {filteredItems.map(item => (\n        <Item key={item.id} item={item} onClick={handleClick} />\n      ))}\n    </div>\n  );\n}\n```\n\nThese patterns help you build more maintainable and performant React applications.',
    'Explore advanced React patterns including compound components, render props, custom hooks, and performance optimization techniques.',
    '2024-01-06 13:30:00',
    NOW(),
    NOW(),
    1
);

-- Insert images for the posts
INSERT INTO images (post_id, filename, original_filename, file_path, file_size, mime_type, alt_text, caption, is_featured, sort_order, created_at, updated_at, version) VALUES
(1, 'blog_1_featured.jpg', 'blog_1_featured.jpg', 'uploads/images/blog_1_featured.jpg', 150000, 'image/jpeg', 'Welcome to Technoprise Blog - Technology and Innovation', 'Featured image for our welcome post showcasing technology and innovation', true, 1, NOW(), NOW(), 1),
(2, 'blog_2_featured.jpg', 'blog_2_featured.jpg', 'uploads/images/blog_2_featured.jpg', 140000, 'image/jpeg', 'Go Programming Language - Building Robust APIs', 'Illustration representing Go programming and API development', true, 1, NOW(), NOW(), 1),
(3, 'blog_3_featured.jpg', 'blog_3_featured.jpg', 'uploads/images/blog_3_featured.jpg', 155000, 'image/jpeg', 'Database Design and Architecture', 'Visual representation of database design principles and best practices', true, 1, NOW(), NOW(), 1),
(4, 'blog_4_featured.jpg', 'blog_4_featured.jpg', 'uploads/images/blog_4_featured.jpg', 145000, 'image/jpeg', 'Modern Frontend Development', 'Illustration showcasing modern frontend frameworks and tools', true, 1, NOW(), NOW(), 1),
(5, 'blog_5_featured.jpg', 'blog_5_featured.jpg', 'uploads/images/blog_5_featured.jpg', 160000, 'image/jpeg', 'Microservices and Docker Containers', 'Visual representation of microservices architecture with Docker', true, 1, NOW(), NOW(), 1),
(6, 'blog_6_featured.jpg', 'blog_6_featured.jpg', 'uploads/images/blog_6_featured.jpg', 152000, 'image/jpeg', 'Advanced React Patterns and Hooks', 'Illustration representing advanced React development patterns', true, 1, NOW(), NOW(), 1);

EOF

echo "Database reset complete. Posts seeded successfully with featured images!"
echo "Sample images have been copied to uploads/images/ directory"
echo ""
echo "Posts created:"
echo "1. Welcome to Technoprise Blog (with featured image)"
echo "2. Getting Started with Go APIs (with featured image)"
echo "3. Database Design Best Practices (with featured image)"
echo "4. Modern Frontend Development (with featured image)"
echo "5. Building Microservices with Docker (with featured image)"
echo "6. Advanced React Patterns (with featured image)"
echo ""
echo "You can now test the edit functionality with these posts and their images!"
EOF