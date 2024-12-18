<template>
  <div class="directory-page">
    <!-- Search Section -->
    <div class="search-section">
      <input type="text" v-model="searchQuery" placeholder="Search majors or courses..." class="search-input" />
    </div>

    <!-- Majors Grid -->
    <div class="majors-grid">
      <div v-for="major in filteredMajors" :key="major.id" :id="`major-${major.id}`" class="major-card"
        :class="{ 'active': selectedMajors.some(m => m.id === major.id) }" @click="toggleMajor(major)">
      <div class="major-header">
        <h3>{{ major.name }}</h3>
        <span class="course-count">{{ major.courses?.length || 0 }} courses</span>
      </div>
      <p class="major-description">{{ major.description }}</p>

        <!-- Courses List (shows when major is selected) -->
        <div v-if="selectedMajors.some(m => m.id === major.id)" class="courses-list">
          <div v-for="courseGroup in groupCoursesByBaseCode(major.courses)" :key="courseGroup.baseCode"
            class="course-group">
            <div class="course-header" @click.stop="toggleCourse(courseGroup)">
              <h4>{{ courseGroup.baseCode }} - {{ courseGroup.title }}</h4>
              <span class="section-count">{{ courseGroup.sections.length }} sections</span>
            </div>

            <!-- Course Sections -->
            <div v-if="expandedCourses.includes(courseGroup.baseCode)" class="course-sections">
              <router-link v-for="section in courseGroup.sections" :key="section.id"
                :to="{ name: 'Info', params: { type: 'course', id: section.id } }" class="section-link">
                <div class="section-info">
                  <span class="section-code">{{ section.course_code }}</span>
                  <span class="professor-name">Prof. {{ section.professor?.name }}</span>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import api from '../api';

  interface Professor {
    id: number;
    name: string;
  }

  interface Course {
    id: number;
    course_code: string;
    title: string;
    professor?: Professor;
  }

  interface Major {
    id: number;
    name: string;
    description: string;
    courses?: Course[];
  }

  interface GroupedCourse {
    baseCode: string;
    title: string;
    sections: Course[];
  }

  export default defineComponent({
    name: 'MajorsPage',
    data() {
      return {
        expandedCourses: [] as string[],
        searchQuery: '',
        loading: false,
        error: null as string | null,
        majors: [] as Major[],
        selectedMajors: [] as Major[]
      };
    },
    computed: {
      filteredMajors(): Major[] {
        const query = this.searchQuery.toLowerCase();

        if (!query) {
          // No side effects here
          return this.majors;
        }

        return this.majors.filter(
          (major) =>
            major.name.toLowerCase().includes(query) ||
            major.courses?.some(
              (course) =>
                course.title.toLowerCase().includes(query) ||
                course.course_code.toLowerCase().includes(query)
          )
        );
      },
    },
    methods: {
      async fetchMajors() {
        try {
          this.loading = true;
          const response = await api.get('/majors');
          this.majors = response.data;
        } catch (error) {
          console.error('Error fetching majors:', error);
          this.error = 'Failed to load majors';
        } finally {
          this.loading = false;
        }
      },
      toggleMajor(major: Major) {
        const index = this.selectedMajors.findIndex(m => m.id === major.id);
        if (index > -1) {
          this.selectedMajors.splice(index, 1);
          console.log(`Deselected major: ${major.name}`);
        } else {
          this.selectedMajors.push(major);
          console.log(`Selected major: ${major.name}`);
        }
      },

      toggleCourse(course: GroupedCourse) {
        const index = this.expandedCourses.indexOf(course.baseCode);
        if (index > -1) {
          this.expandedCourses.splice(index, 1);
          console.log(`Collapsed course: ${course.baseCode}`);
        } else {
          this.expandedCourses.push(course.baseCode);
          console.log(`Expanded course: ${course.baseCode}`);
        }
      },

      toggleMajorsAndCourses(filteredMajors: Major[]) {
        // Toggle majors
        this.selectedMajors = filteredMajors;

        // Toggle courses within selected majors
        filteredMajors.forEach(major => {
          if (major.courses) {
            major.courses.forEach(course => {
              const baseCode = this.getBaseCourseCode(course.course_code);
              if (!this.expandedCourses.includes(baseCode)) {
                this.expandedCourses.push(baseCode);
              }
            });
          }
        });
      },

      getBaseCourseCode(courseCode: string): string {
        return courseCode.split('-')[0];
      },
      groupCoursesByBaseCode(courses: Course[] = []): GroupedCourse[] {
        const groupedCourses: Record<string, GroupedCourse> = courses.reduce((acc, course) => {
          const baseCode = this.getBaseCourseCode(course.course_code);
          if (!acc[baseCode]) {
            acc[baseCode] = {
            baseCode,
            title: course.title.split('(')[0].trim(),
            sections: []
            };
          }
          acc[baseCode].sections.push(course);
          return acc;
        }, {} as Record<string, GroupedCourse>);

        return Object.values(groupedCourses);
      },

      handleRouteQuery() {
        const majorName = this.$route.query.select as string;
        const courseSearch = this.$route.query.search as string;

        if (majorName && this.majors.length > 0) {
          const major = this.majors.find(m => m.name === majorName);

          if (major) {
            // Select our maor
            this.selectedMajors = [major];
            this.searchQuery = major.name;

            this.$nextTick(() => {
              const element = document.getElementById(`major-${major.id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            });

            // Handle course search within the selected major
            if (courseSearch && major.courses) {
              const matchingCourse = major.courses.find((course) =>
                course.title.toLowerCase().includes(courseSearch.toLowerCase())
              );

              if (matchingCourse) {
                this.searchQuery = matchingCourse.title; // Update search query wiht course title
                const baseCode = this.getBaseCourseCode(matchingCourse.course_code);

                // Expand the course group
                if (!this.expandedCourses.includes(baseCode)) {
                  this.expandedCourses.push(baseCode);
                }

                // Ensure the course is visually selected
                this.$nextTick(() => {
                  const courseElement = document.getElementById(`course-${matchingCourse.id}`);
                  if (courseElement) {
                    courseElement.scrollIntoView({ behavior: 'smooth' });
                  }
                });
                return; // Stop further processing once a match is found
              }
            }
          }
        }
      },
    },

    watch: {
      searchQuery: {
        handler(query: string) {
          if (!query) {
            // Untoggle everything when query is cleared
            this.selectedMajors = [];
            this.expandedCourses = [];
          } else {
            // Toggle majors and courses for the filtered results
            const filtered = this.majors.filter(
              (major) =>
                major.name.toLowerCase().includes(query.toLowerCase()) ||
                major.courses?.some(
                  (course) =>
                    course.title.toLowerCase().includes(query.toLowerCase()) ||
                    course.course_code.toLowerCase().includes(query.toLowerCase())
                )
            );

            filtered.forEach((major) => {
              // Ensure major is selected
              if (!this.selectedMajors.some((m) => m.id === major.id)) {
                this.toggleMajor(major);
              }

              // Ensure filtered courses are toggled
              major.courses?.filter(
                (course) =>
                  course.title.toLowerCase().includes(query.toLowerCase()) ||
                  course.course_code.toLowerCase().includes(query.toLowerCase())
                ).forEach((course) => {
                  const baseCode = this.getBaseCourseCode(course.course_code);
                  const groupedCourse = {
                    baseCode,
                    title: course.title,
                    sections: [course],
                  };

                  if (!this.expandedCourses.includes(baseCode)) {
                    this.toggleCourse(groupedCourse);
                  }
                });
              });
            }
          },
        immediate: true, // Run on component mount
      },
      majors: {
        handler(newMajors) {
          if (newMajors.length > 0) {
            this.handleRouteQuery();
          }
        },
        immediate: true
      },

      '$route.query': {
        handler() {
          this.handleRouteQuery();
        },
        immediate: true
      }
    },
  mounted() {
    this.fetchMajors();
  }
  });
</script>

<style>
  .directory-page {
    padding: 20px;
    width: 80%;
    margin: 0 auto;
    scroll-behavior: smooth;
    }

  .search-section {
    margin-bottom: 30px;
    }

  .search-input {
    width: 100%;
    padding: 12px 20px;
    font-size: 16px;
    border: 2px solid #f0e2e2;
    border-radius: 8px;
    transition: all 0.3s ease;
    }

  .majors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Adjusts horizontally based on available space */
    gap: 20px;
    justify-content: center;
    width: 100%;
    margin: 0 auto;
    padding: 10px;
  }

  .major-card {
    background: white;
    border-radius: 10px;
    padding: 20px;
    align-self: start; /* Ensures cards align without stretching height*/
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.05);
    }

  .major-card:hover{
  transform: translateY(-2px);
  box-shadow:
  0 4px 8px rgba(0, 0, 0, 0.12),
  0 8px 16px rgba(0, 0, 0, 0.08);
  }

  .major-card.active{
  border-left: 4px solid #e14242;
  padding-left: 16px;
  animation: highlight 1s ease-in-out;
  }

  @keyframes highlight {
  0% {
  background-color: #fff;
  }

  50% {
  background-color: #fde3e3;
  }

  100% {
  background-color: #fff;
  }
  }

  .major-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  }

  .major-header h3 {
  font-size: 1.5em;
  color: #482d2d;
  margin: 0;
  }

  .course-count {
  color: #967171;
  font-size: 0.9em;
  }

  .major-description {
  color: #684a4a;
  margin: 0;
  }

  .courses-list {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0e2e2;
  }

  .course-group {
  margin-bottom: 15px;
  }

  .course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #fcf7f7;
  border-radius: 6px;
  cursor: pointer;

  }

  .course-header:hover {
  background: #f7eded;
  }

  .course-header h4 {
  margin: 0;
  color: #482d2d;
  }

  .section-count {
  color: #967171;
  font-size: 0.9em;
  }

  .course-sections {
  margin: 10px 0;
  padding-left: 20px;

  }

  .section-link {
  display: block;
  padding: 8px 12px;
  margin: 5px 0;
  color: #4a5568;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s ease;

  }

  .section-link:hover {
  background-color: #f7eded;
  }

  .section-info {
  display: flex;
  justify-content: space-between;
  align-items: center;

  }

  .section-code {
  font-weight: 500;
  }

  .professor-name {
  color: #718096;
  font-size: 0.9em;
  }

  /* Updated course css and activated if the isCourseActive function is true? */
  .course-header.active-course {
  border-left: 4px solid #e14242;
  padding-left: 16px;
  }
</style>
