#!/usr/bin/env node

const prompts = require('prompts');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function getUserInput() {
  return prompts([
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
}

function createProjectDirectory(projectPath) {
  fs.mkdirSync(projectPath);
}

function installDependencies(projectPath, packageManager, projectName) {
  console.log('📦 Installing dependencies...');
  
  try {
    execSync(`${packageManager} install`, { 
      cwd: projectPath, 
      stdio: 'inherit' 
    });
    console.log('✅ Dependencies installed successfully!');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    console.log('You can install them manually by running:');
    console.log(`  cd ${projectName}`);
    console.log(`  ${packageManager} install`);
  }
}

function showSuccessMessage(projectPath, projectName, packageManager) {
  console.log('✅ Project created successfully!');
  console.log(`📁 Created in: ${projectPath}`);
  console.log('');
}

function showNextSteps(projectName, packageManager) {
  console.log('Next steps:');
  console.log(`  cd ${projectName}`);
  console.log(`  ${packageManager} run dev`);
}

async function main() {
  console.log('🚀 Create Simple TypeScript Project\n');

  const response = await getUserInput();

  if (!response.projectName) {
    console.log('❌ Cancelled');
    process.exit(1);
  }

  const projectPath = path.join(process.cwd(), response.projectName);
  const templateDir = path.join(__dirname, '..', 'template');
  
  try {
    createProjectDirectory(projectPath);
    copyTemplate(templateDir, projectPath, response.projectName, response.packageManager);
    showSuccessMessage(projectPath, response.projectName, response.packageManager);
    installDependencies(projectPath, response.packageManager, response.projectName);
    console.log('');
    showNextSteps(response.projectName, response.packageManager);

  } catch (error) {
    console.error('❌ Error creating project:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);