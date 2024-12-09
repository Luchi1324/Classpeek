<template>
  <div id="app">
    <nav>
      <!-- This is the main navigation bar of the website -->
      <!-- Once you have created a new page in the router, insert it here -->
      <ul>
        <!-- Shared links -->
        <li><router-link to="/">Home</router-link></li>
        <li><router-link to="/about">About</router-link></li>
        <li><router-link to="/subjects">Subjects</router-link></li>
        <li><router-link to="/majors">Majors</router-link></li>

        <!-- Protected links (We can restrict these based on the user.user.user_type and using Vue's v-if)-->
        <li v-if="user.user.user_type === 'PROFESSOR'"><router-link to="/my-courses">My Courses</router-link></li>
        <li v-if="user.user.user_type === 'PROFESSOR' || user.user.user_type === 'ADMIN'"><router-link to="/all-courses">All Courses</router-link></li>
        <li v-if="user.user.user_type === 'PROFESSOR' || user.user.user_type === 'ADMIN'"><router-link to="/course-form">Course Form</router-link></li>
        <li v-if="user.user.user_type === 'ADMIN'"><router-link to="/major-form">Major Form</router-link></li>
        <li v-if="user.user.user_type === 'ADMIN'"><router-link to="/subject-form">Subject Form</router-link></li>
        <li v-if="user.user.user_type === 'ADMIN'"><router-link to="/reports">Reports</router-link></li>

        <!-- Profile icon -->
        <li id="profileDropdown">
          <div id="profileIcon" @click="toggleDropdown">
            <font-awesome-icon :icon="['fas', 'user']" />
            <span>{{ user.user.name || "Guest" }}</span>
          </div>
          <ul v-if="isDropdownOpen" class="dropdown-menu">
            <li v-if="user.isAuthenticated" @click="viewProfile">View Profile</li>
            <li v-if="user.isAuthenticated" @click="logout">Logout</li>
            <li v-else @click="redirectToSignIn">Sign In</li>
            <li v-if="!user.isAuthenticated" @click="createAccount">
              Create Account
            </li>
          </ul>
        </li>
      </ul>
    </nav>
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import sessionStore from "./store/session";

export default defineComponent({
  name: "App",
  data() {
    return {
      isDropdownOpen: false,
      user: sessionStore,
    };
  },
  methods: {
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    // Various methods to handle user based sessions/info
    viewProfile() {
      this.isDropdownOpen = false;
      // For professors, we direct them to their info page as it is their 'profile'
      if (this.user.user.user_type === "PROFESSOR") {
        this.$router.push(`/info/professor/${this.user.user.id}`);
      } else {
        this.$router.push("/profile");
      }
    },
    async logout() {
      sessionStore.logout();
      this.isDropdownOpen = false;
      this.$router.push("/signin");
    },
    redirectToSignIn() {
      this.$router.push("/signin");
      this.isDropdownOpen = false;
    },
    createAccount() {
      this.$router.push("/signup");
      this.isDropdownOpen = false;
    },
  },
  mounted() {
    this.user.fetchSession();
  },
});
</script>

<style>
* {
  box-sizing: border-box;
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
}

nav {
  background-color: #ff0932;
  padding: 1rem;
  position: relative;
}

nav ul {
  list-style: none;
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 0;
  padding: 0;
}

nav ul li {
  position: relative;
}

nav ul li a {
  color: white;
  text-decoration: none;
  font-weight: bold;
  font-size: 16px;
}

nav ul li a.router-link-exact-active {
  text-decoration: underline;
}

#profileIcon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  display: flex; /* Ensure icon and name are inline */
  align-items: center; /* Vertically align text and icon */
  gap: 8px; /* Add spacing between icon and name */
  color: white;
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap; /* Prevent text wrapping */
}

#profileDropdown {
  margin-left: auto;
  display: flex;
  align-items: center;
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%; /* Directly below the app bar */
  right: 0; /* Align dropdown to the right edge */
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  list-style: none;
  margin: 0;
  padding: 0;
  z-index: 1000;
  width: 150px;
  display: none;
  flex-direction: column;
}

.dropdown-menu li {
  padding: 10px 20px;
  cursor: pointer;
  display: block;
  text-align: left;
  color: #333;
  font-size: 14px;
  font-weight: bold;
}

.dropdown-menu li:hover {
  background-color: #f0f0f0;
  color: #ff0932;
}

#profileDropdown:hover .dropdown-menu {
  display: flex;
}
body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

</style>
