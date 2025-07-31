#!/usr/bin/env node

const prompts = require('prompts');
const fs = require('fs');
const path = require('path');

function copyTemplate(templateDir, targetDir, projectName, packageManager) {
  const files = fs.readdirSync(templateDir, { withFileTypes: true });

  for (const file of files) {
    const sourcePath = path.join(templateDir, file.name);
    let targetPath = path.join(targetDir, file.name);

    if (file.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copyTemplate(sourcePath, targetPath, projectName, packageManager);
    } else {
      let content = fs.readFileSync(sourcePath, 'utf8');
      
      // Replace placeholders
      content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
      content = content.replace(/\{\{PACKAGE_MANAGER\}\}/g, packageManager);
      
      // No special file name handling needed anymore
      
      fs.writeFileSync(targetPath, content);
    }
  }
}

async function main() {
  console.log('🚀 Create Simple TypeScript Project\n');

  const response = await prompts([
    {
      type: 'text',
      name: 'projectName',
      message: 'What is your project name?',
      validate: value => {
        if (!value) return 'Project name is required';
        if (!/^[a-zA-Z0-9-_]+$/.test(value)) return 'Project name can only contain letters, numbers, hyphens, and underscores';
        if (fs.existsSync(value)) return 'Directory already exists';
        return true;
      }
    },
    {
      type: 'select',
      name: 'packageManager',
      message: 'Which package manager do you prefer?',
      choices: [
        { title: 'npm', value: 'npm' },
        { title: 'pnpm', value: 'pnpm' }
      ],
      initial: 0
    }
  ]);

  if (!response.projectName) {
    console.log('❌ Cancelled');
    process.exit(1);
  }

  const projectPath = path.join(process.cwd(), response.projectName);
  const templateDir = path.join(__dirname, '..', 'template');
  
  try {
    // Create project directory
    fs.mkdirSync(projectPath);

    // Copy template files
    copyTemplate(templateDir, projectPath, response.projectName, response.packageManager);

    console.log('✅ Project created successfully!');
    console.log(`📁 Created in: ${projectPath}`);
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${response.projectName}`);
    console.log(`  ${response.packageManager} install`);
    console.log(`  ${response.packageManager} run dev`);

  } catch (error) {
    console.error('❌ Error creating project:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);