"""
Concept Dependency Graph - Manages concept prerequisites and learning paths.
"""
from typing import Dict, List, Optional, Set
import logging
from collections import deque

from content.models import Concept, ConceptMastery

logger = logging.getLogger('somoai.learning_engine')


class ConceptDependencyGraph:
    """
    Manages concept prerequisites and validates learning paths.

    Prerequisites must have >= 60% mastery before dependent concepts.
    """

    PREREQUISITE_MASTERY_THRESHOLD = 60.0

    def can_attempt_concept(self, student_id: str, concept_id: str) -> Dict:
        """
        Check if student has mastered prerequisites.

        Args:
            student_id: UUID of the student
            concept_id: UUID of the concept to check

        Returns:
            Dictionary with eligibility status and details
        """
        try:
            # Get the concept
            try:
                concept = Concept.objects.prefetch_related('prerequisites').get(id=concept_id)
            except Concept.DoesNotExist:
                return {
                    'can_attempt': False,
                    'reason': 'Concept not found',
                    'missing_prerequisites': []
                }

            # Get all prerequisites
            prerequisites = concept.prerequisites.all()

            if not prerequisites.exists():
                # No prerequisites required
                return {
                    'can_attempt': True,
                    'reason': 'No prerequisites required',
                    'prerequisites_status': []
                }

            # Check mastery of each prerequisite
            missing_prerequisites = []
            prerequisites_status = []

            for prereq in prerequisites:
                try:
                    mastery = ConceptMastery.objects.get(
                        student_id=student_id,
                        concept=prereq
                    )
                    mastery_level = mastery.mastery_level
                    has_mastered = mastery_level >= self.PREREQUISITE_MASTERY_THRESHOLD

                except ConceptMastery.DoesNotExist:
                    mastery_level = 0
                    has_mastered = False

                status = {
                    'concept_id': str(prereq.id),
                    'concept_name': prereq.name,
                    'concept_code': prereq.code,
                    'mastery_level': mastery_level,
                    'required_mastery': self.PREREQUISITE_MASTERY_THRESHOLD,
                    'is_mastered': has_mastered
                }

                prerequisites_status.append(status)

                if not has_mastered:
                    missing_prerequisites.append(status)

            can_attempt = len(missing_prerequisites) == 0

            return {
                'can_attempt': can_attempt,
                'reason': 'Ready to attempt' if can_attempt else 'Prerequisites not met',
                'prerequisites_status': prerequisites_status,
                'missing_prerequisites': missing_prerequisites
            }

        except Exception as e:
            logger.error(
                f"Error checking prerequisites for student {student_id}, "
                f"concept {concept_id}: {str(e)}"
            )
            return {
                'can_attempt': False,
                'reason': f'Error: {str(e)}',
                'missing_prerequisites': []
            }

    def get_learning_path(self, student_id: str, target_concept_id: str) -> List[Dict]:
        """
        Generate optimal path from current state to target concept.

        Uses topological sort to create a valid learning sequence.

        Args:
            student_id: UUID of the student
            target_concept_id: UUID of the target concept

        Returns:
            List of concepts in order to master
        """
        try:
            # Get target concept
            target_concept = Concept.objects.prefetch_related('prerequisites').get(id=target_concept_id)

            # Build complete prerequisite tree
            all_prerequisites = self._get_all_prerequisites(target_concept)

            # Get student's current mastery levels
            masteries = ConceptMastery.objects.filter(
                student_id=student_id,
                concept_id__in=[c.id for c in all_prerequisites] + [target_concept.id]
            )

            mastery_map = {
                str(m.concept_id): m.mastery_level
                for m in masteries
            }

            # Filter out already mastered concepts
            concepts_to_learn = [
                concept for concept in all_prerequisites
                if mastery_map.get(str(concept.id), 0) < self.PREREQUISITE_MASTERY_THRESHOLD
            ]

            # Add target concept if not mastered
            if mastery_map.get(str(target_concept.id), 0) < self.PREREQUISITE_MASTERY_THRESHOLD:
                concepts_to_learn.append(target_concept)

            # Perform topological sort to get valid learning order
            learning_path = self._topological_sort(concepts_to_learn)

            return [
                {
                    'concept_id': str(concept.id),
                    'concept_name': concept.name,
                    'concept_code': concept.code,
                    'subject': concept.subject.name,
                    'grade_level': concept.grade_level,
                    'current_mastery': mastery_map.get(str(concept.id), 0),
                    'is_target': concept.id == target_concept.id
                }
                for concept in learning_path
            ]

        except Concept.DoesNotExist:
            logger.error(f"Target concept {target_concept_id} not found")
            return []
        except Exception as e:
            logger.error(
                f"Error generating learning path for student {student_id}, "
                f"target {target_concept_id}: {str(e)}"
            )
            return []

    def get_prerequisite_tree(self, concept_id: str) -> Dict:
        """
        Get full prerequisite tree for a concept.

        Args:
            concept_id: UUID of the concept

        Returns:
            Nested dictionary representing prerequisite tree
        """
        try:
            concept = Concept.objects.prefetch_related('prerequisites').get(id=concept_id)

            def build_tree(concept_obj: Concept, visited: Optional[Set] = None) -> Dict:
                if visited is None:
                    visited = set()

                # Prevent circular dependencies
                if concept_obj.id in visited:
                    return {
                        'id': str(concept_obj.id),
                        'name': concept_obj.name,
                        'code': concept_obj.code,
                        'circular': True
                    }

                visited.add(concept_obj.id)

                prereqs = concept_obj.prerequisites.all()

                return {
                    'id': str(concept_obj.id),
                    'name': concept_obj.name,
                    'code': concept_obj.code,
                    'grade_level': concept_obj.grade_level,
                    'subject': concept_obj.subject.name,
                    'prerequisites': [
                        build_tree(prereq, visited.copy())
                        for prereq in prereqs
                    ]
                }

            return build_tree(concept)

        except Concept.DoesNotExist:
            logger.error(f"Concept {concept_id} not found")
            return {}
        except Exception as e:
            logger.error(f"Error getting prerequisite tree for concept {concept_id}: {str(e)}")
            return {}

    def _get_all_prerequisites(self, concept: Concept) -> List[Concept]:
        """
        Recursively get all prerequisites for a concept.

        Args:
            concept: The concept to get prerequisites for

        Returns:
            List of all prerequisite concepts
        """
        all_prereqs = []
        visited = set()

        def traverse(c: Concept):
            if c.id in visited:
                return
            visited.add(c.id)

            for prereq in c.prerequisites.all():
                traverse(prereq)
                if prereq not in all_prereqs:
                    all_prereqs.append(prereq)

        traverse(concept)
        return all_prereqs

    def _topological_sort(self, concepts: List[Concept]) -> List[Concept]:
        """
        Perform topological sort on concepts based on prerequisites.

        Args:
            concepts: List of concepts to sort

        Returns:
            Sorted list of concepts (prerequisites first)
        """
        # Build adjacency list and in-degree map
        concept_map = {c.id: c for c in concepts}
        in_degree = {c.id: 0 for c in concepts}
        adjacency = {c.id: [] for c in concepts}

        for concept in concepts:
            for prereq in concept.prerequisites.all():
                if prereq.id in concept_map:
                    adjacency[prereq.id].append(concept.id)
                    in_degree[concept.id] += 1

        # Kahn's algorithm
        queue = deque([c_id for c_id in in_degree if in_degree[c_id] == 0])
        sorted_concepts = []

        while queue:
            current_id = queue.popleft()
            sorted_concepts.append(concept_map[current_id])

            for neighbor_id in adjacency[current_id]:
                in_degree[neighbor_id] -= 1
                if in_degree[neighbor_id] == 0:
                    queue.append(neighbor_id)

        # If not all concepts were processed, there's a cycle
        if len(sorted_concepts) != len(concepts):
            logger.warning("Circular dependency detected in concept prerequisites")
            # Return partial sort
            return sorted_concepts

        return sorted_concepts
