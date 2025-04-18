"""
Script to verify that pyproject.toml and setup.py are in sync.
This script checks that package metadata and dependencies are consistent
between the two files.
"""

import sys
import re
import os
import toml
from pathlib import Path
import ast
from typing import Dict, List, Any, Set, Tuple

def find_repo_root() -> Path:
    """Find the repository root."""
    current_path = Path(__file__).resolve().parent
    while current_path != current_path.parent:
        if (current_path / ".git").is_dir():
            return current_path
        current_path = current_path.parent
    raise FileNotFoundError("Could not find repository root")

def parse_setup_py(setup_py_path: Path) -> Dict[str, Any]:
    """Parse setup.py to extract package metadata and dependencies."""
    with open(setup_py_path, "r") as f:
        content = f.read()
    
    result = {}
    
    name_match = re.search(r'name\s*=\s*["\']([^"\']+)["\']', content)
    if name_match:
        result["name"] = name_match.group(1)
    
    desc_match = re.search(r'description\s*=\s*["\']([^"\']+)["\']', content)
    if desc_match:
        result["description"] = desc_match.group(1)
        
    python_requires_match = re.search(r'python_requires\s*=\s*["\']([^"\']+)["\']', content)
    if python_requires_match:
        result["requires-python"] = python_requires_match.group(1)
    
    dependencies = {}
    
    install_requires_match = re.search(r'install_requires\s*=\s*\[(.*?)\]', content, re.DOTALL)
    if install_requires_match:
        deps_str = install_requires_match.group(1)
        dependencies["dependencies"] = []
        for line in deps_str.split(","):
            line = line.strip()
            if line and line.startswith('"') or line.startswith("'"):
                line = re.sub(r'#.*$', '', line).strip()
                if line:
                    dependencies["dependencies"].append(line.strip('\'"'))
    
    extras_match = re.search(r'extras_require\s*=\s*({.*?})', content, re.DOTALL)
    if extras_match:
        extras_str = extras_match.group(1)
        dependencies["optional-dependencies"] = {}
        current_key = None
        in_list = False
        for line in extras_str.split('\n'):
            line = line.strip()
            if not line or line in ['{}', '']:
                continue
                
            key_match = re.search(r'["\']([^"\']+)["\']:\s*\[', line)
            if key_match:
                current_key = key_match.group(1)
                dependencies["optional-dependencies"][current_key] = []
                in_list = True
                items_match = re.search(r'\[(.*?)(?:\]|$)', line)
                if items_match:
                    items_str = items_match.group(1).strip()
                    if items_str and not items_str.endswith('['):
                        for item in re.findall(r'["\']([^"\']+)["\']', items_str):
                            dependencies["optional-dependencies"][current_key].append(item)
                continue
            
            if in_list and (']' in line or '],' in line):
                in_list = False
                items = re.findall(r'["\']([^"\']+)["\']', line)
                for item in items:
                    dependencies["optional-dependencies"][current_key].append(item)
                continue
            
            if in_list and current_key:
                items = re.findall(r'["\']([^"\']+)["\']', line)
                for item in items:
                    dependencies["optional-dependencies"][current_key].append(item)
    
    result.update(dependencies)
    return result

def parse_pyproject_toml(pyproject_path: Path) -> Dict[str, Any]:
    """Parse pyproject.toml to extract package metadata and dependencies."""
    with open(pyproject_path, "r") as f:
        pyproject = toml.load(f)
    
    result = {}
    
    if "project" in pyproject:
        project = pyproject["project"]
        
        for key in ["name", "description", "requires-python"]:
            if key in project:
                result[key] = project[key]
        
        if "dependencies" in project:
            result["dependencies"] = project["dependencies"]
        
        if "optional-dependencies" in project:
            result["optional-dependencies"] = project["optional-dependencies"]
    
    return result

def compare_dependencies(setup_deps: List[str], pyproject_deps: List[str]) -> List[str]:
    """Compare dependencies between setup.py and pyproject.toml."""
    def normalize_dep(dep: str) -> str:
        dep = re.sub(r'#.*$', '', dep).strip()
        dep = dep.strip('\'"')
        dep = re.sub(r'\s*([<>=~!])=?\s*', r'\1', dep)
        return dep.lower()
    
    setup_deps_norm = {normalize_dep(d) for d in setup_deps if d.strip()}
    pyproject_deps_norm = {normalize_dep(d) for d in pyproject_deps if d.strip()}
    
    differences = []
    for dep in setup_deps_norm - pyproject_deps_norm:
        differences.append(f"Dependency in setup.py but not in pyproject.toml: {dep}")
    
    for dep in pyproject_deps_norm - setup_deps_norm:
        differences.append(f"Dependency in pyproject.toml but not in setup.py: {dep}")
    
    return differences

def compare_extras(setup_extras: Dict[str, List[str]], pyproject_extras: Dict[str, List[str]]) -> List[str]:
    """Compare optional dependencies."""
    differences = []
    
    setup_keys = set(setup_extras.keys())
    pyproject_keys = set(pyproject_extras.keys())
    
    for key in setup_keys - pyproject_keys:
        differences.append(f"Extra '{key}' in setup.py but not in pyproject.toml")
    
    for key in pyproject_keys - setup_keys:
        differences.append(f"Extra '{key}' in pyproject.toml but not in setup.py")
    
    for key in setup_keys.intersection(pyproject_keys):
        deps_diff = compare_dependencies(setup_extras[key], pyproject_extras[key])
        for diff in deps_diff:
            differences.append(f"In extra '{key}': {diff}")
    
    return differences

def main() -> int:
    """Main function."""
    repo_root = find_repo_root()
    setup_py_path = repo_root / "setup.py"
    pyproject_path = repo_root / "pyproject.toml"
    
    if not setup_py_path.exists():
        print(f"Error: {setup_py_path} does not exist")
        return 1
    
    if not pyproject_path.exists():
        print(f"Error: {pyproject_path} does not exist")
        return 1
    
    setup_py_data = parse_setup_py(setup_py_path)
    pyproject_data = parse_pyproject_toml(pyproject_path)
    
    differences = []
    for key in ["name", "description", "requires-python"]:
        if key in setup_py_data and key in pyproject_data:
            if setup_py_data[key] != pyproject_data[key]:
                differences.append(f"Mismatch in '{key}': setup.py has '{setup_py_data[key]}', pyproject.toml has '{pyproject_data[key]}'")
        elif key in setup_py_data:
            differences.append(f"'{key}' in setup.py but not in pyproject.toml")
        elif key in pyproject_data:
            differences.append(f"'{key}' in pyproject.toml but not in setup.py")
    
    if "dependencies" in setup_py_data and "dependencies" in pyproject_data:
        deps_diff = compare_dependencies(setup_py_data["dependencies"], pyproject_data["dependencies"])
        differences.extend(deps_diff)
    elif "dependencies" in setup_py_data:
        differences.append("Dependencies defined in setup.py but not in pyproject.toml")
    elif "dependencies" in pyproject_data:
        differences.append("Dependencies defined in pyproject.toml but not in setup.py")
    
    if "optional-dependencies" in setup_py_data and "optional-dependencies" in pyproject_data:
        extras_diff = compare_extras(setup_py_data["optional-dependencies"], pyproject_data["optional-dependencies"])
        differences.extend(extras_diff)
    elif "optional-dependencies" in setup_py_data:
        differences.append("Optional dependencies defined in setup.py but not in pyproject.toml")
    elif "optional-dependencies" in pyproject_data:
        differences.append("Optional dependencies defined in pyproject.toml but not in setup.py")
    
    if differences:
        print("Found differences between setup.py and pyproject.toml:")
        for diff in differences:
            print(f"  - {diff}")
        return 1
    else:
        print("setup.py and pyproject.toml are in sync!")
        return 0

if __name__ == "__main__":
    sys.exit(main())
