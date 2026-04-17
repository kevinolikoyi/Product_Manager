'use client';

import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectForm from '@/components/forms/ProjectForm';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useProjects } from '@/lib/store';
import { Project } from '@/data/mockProjects';

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const projectsHook = useProjects();

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce projet ?')) {
      projectsHook.dispatch({ type: 'DELETE_PROJECT', payload: id });
    }
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleProjectSuccess = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    alert(editingProject ? 'Projet modifié avec succès !' : 'Projet créé avec succès !');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Projets</h1>
          <Button onClick={handleAddProject}>
            + Ajouter un projet
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projectsHook.projects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <Modal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          title={editingProject ? 'Modifier le projet' : 'Ajouter un projet'}
        >
          <ProjectForm 
            project={editingProject} 
            onClose={handleCloseModal} 
            onSuccess={handleProjectSuccess} 
          />
        </Modal>
      </div>
    </Layout>
  );
}
