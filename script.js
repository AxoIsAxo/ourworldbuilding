// script.js

document.addEventListener('DOMContentLoaded', () => {
    const roadmapContainer = document.getElementById('roadmap-container');
    const overallProgressBar = document.getElementById('overall-progress');
    const overallProgressText = document.getElementById('overall-progress-text');

    // --- State Object ---
    // Defines the default structure and holds the current state
    let roadmapState = {
        tasks: {}, // Populated dynamically based on HTML or loaded data
        stages: {}  // Populated dynamically based on HTML or loaded data
    };

    // --- Helper: Get Task ID from element ---
    function getTaskId(element) {
        const taskItem = element.closest('.task-item');
        return taskItem ? taskItem.dataset.taskId : null;
    }

    // --- Helper: Get Stage ID from element ---
     function getStageId(element) {
        const stage = element.closest('.roadmap-stage');
        return stage ? stage.id : null;
    }

    // --- Update Overall Progress Bar ---
    function updateOverallProgress() {
        const allTasks = document.querySelectorAll('.task-item');
        const completedTasks = document.querySelectorAll('.task-item .task-status-icon.completed');
        const totalTasks = allTasks.length;
        const completedCount = completedTasks.length;

        const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

        if (overallProgressBar && overallProgressText) {
             overallProgressBar.value = progressPercentage;
            overallProgressText.textContent = `${progressPercentage}%`;
        }

         // Optional: Update individual stage progress (left as an exercise)
         /*
         document.querySelectorAll('.roadmap-stage').forEach(stage => {
            const stageTasks = stage.querySelectorAll('.task-item');
            const completedStageTasks = stage.querySelectorAll('.task-item .task-status-icon.completed');
            const stageTotal = stageTasks.length;
            const stageCompleted = completedStageTasks.length;
            const stagePercentage = stageTotal > 0 ? Math.round((stageCompleted / stageTotal) * 100) : 0;
            const stageStatusEl = stage.querySelector('.stage-status');
            if (stageStatusEl) {
                stageStatusEl.textContent = `${stagePercentage}%`;
                 // You could add classes based on percentage here for styling
            }
        });
        */
    }


    // --- Cycle Task Status ---
    function cycleTaskStatus(taskItem) {
        if (!taskItem) return;

        const statusIcon = taskItem.querySelector('.task-status-icon');
        const taskId = taskItem.dataset.taskId;
        if (!statusIcon || !taskId) return;

        const currentStatus = statusIcon.classList.contains('not-started') ? 'not-started' :
                              statusIcon.classList.contains('in-progress') ? 'in-progress' : 'completed';

        // Define the cycle order
        const nextStatusMap = {
            'not-started': 'in-progress',
            'in-progress': 'completed',
            'completed': 'not-started'
        };
        const nextStatus = nextStatusMap[currentStatus];

        // Update classes and icon
        statusIcon.classList.remove('not-started', 'in-progress', 'completed');
        statusIcon.classList.add(nextStatus);

        let iconHtml = '';
        let title = '';
        switch (nextStatus) {
            case 'in-progress':
                iconHtml = '<i class="fas fa-circle-notch fa-spin"></i>';
                title = 'In Progress';
                break;
            case 'completed':
                iconHtml = '<i class="fas fa-check-circle"></i>';
                title = 'Completed';
                break;
            case 'not-started':
            default:
                iconHtml = '<i class="far fa-circle"></i>';
                title = 'Not Started';
                break;
        }
        statusIcon.innerHTML = iconHtml;
        statusIcon.title = title;

        // Update state object
        if (roadmapState.tasks[taskId]) {
             roadmapState.tasks[taskId].status = nextStatus;
         } else {
            // If task wasn't in state, add it (can happen if HTML added dynamically)
             roadmapState.tasks[taskId] = { status: nextStatus, notes: '' };
             console.warn(`Task ${taskId} initialised in state during cycle.`);
         }

        // Add visual flair (optional bounce)
        taskItem.style.transform = 'scale(1.03)';
        setTimeout(() => taskItem.style.transform = 'scale(1)', 150);

        saveState(); // Save changes
        updateOverallProgress(); // Update progress bar
    }

    // --- Toggle Stage Collapse/Expand ---
     function toggleStage(stage) {
        if (!stage) return;
         const stageId = stage.id;
         const isCollapsed = stage.classList.toggle('stage-collapsed');
         const content = stage.querySelector('.stage-content');
         const icon = stage.querySelector('.toggle-stage-details i');

         if (content && icon) {
             if (isCollapsed) {
                 // Collapse: set maxHeight to 0
                 content.style.maxHeight = '0';
                  content.style.paddingTop = '0';
                 content.style.paddingBottom = '0';
                  icon.style.transform = 'rotate(-90deg)';
             } else {
                 // Expand: set maxHeight to fit content
                 content.style.paddingTop = ''; // Reset to CSS default
                 content.style.paddingBottom = ''; // Reset to CSS default
                 content.style.maxHeight = content.scrollHeight + 'px';
                  icon.style.transform = 'rotate(0deg)';

                  // Optional: Recalculate maxHeight after a short delay if content might change dynamically inside
                  setTimeout(() => {
                      if(!stage.classList.contains('stage-collapsed')) { // Check if still expanded
                          content.style.maxHeight = content.scrollHeight + 'px';
                      }
                 }, 300); // Adjust delay based on potential content loading/rendering time
             }
         }

         // Update state object
        if (roadmapState.stages[stageId]) {
            roadmapState.stages[stageId].collapsed = isCollapsed;
        } else {
             roadmapState.stages[stageId] = { collapsed: isCollapsed };
             console.warn(`Stage ${stageId} initialised in state during toggle.`);
        }

         saveState(); // Save changes
    }

    // --- Toggle Task Notes Visibility ---
     function toggleNotes(taskItem) {
        if (!taskItem) return;
         const notesDiv = taskItem.querySelector('.task-notes');
         const toggleButton = taskItem.querySelector('.toggle-notes');

         if (!notesDiv) return;

         const isHidden = notesDiv.classList.contains('notes-hidden');

        if (isHidden) {
            // Show notes: remove class, then set maxHeight
             notesDiv.classList.remove('notes-hidden');
             // Make sure display allows scrollHeight calculation
             notesDiv.style.display = 'block';
              notesDiv.style.padding = ''; // Reset padding to default CSS value before calculating height
              notesDiv.style.marginTop = ''; // Reset margin
              notesDiv.style.borderLeft = ''; // Reset border


              // Set maxHeight slightly larger than scrollHeight to be safe, or just use scrollHeight
            notesDiv.style.maxHeight = notesDiv.scrollHeight + 'px';
            if (toggleButton) toggleButton.classList.add('active'); // Visual feedback for button

        } else {
            // Hide notes: set maxHeight to 0, then add class after transition
             notesDiv.style.maxHeight = '0';
             notesDiv.style.paddingTop = '0'; // Collapse padding during transition
             notesDiv.style.paddingBottom = '0';
             notesDiv.style.marginTop = '0'; // Collapse margin
             notesDiv.style.borderLeft = 'none'; // Hide border


             // Add 'notes-hidden' class after the transition should have ended
            // The class primarily helps with initial state and potentially other CSS rules
             // The transition itself is driven by maxHeight
            notesDiv.addEventListener('transitionend', () => {
                  if (notesDiv.style.maxHeight === '0px') { // Check if it was indeed collapsing
                    notesDiv.classList.add('notes-hidden');
                    notesDiv.style.display = 'none'; // Optional: Truly remove from layout flow when hidden
                  }
            }, { once: true }); // Remove listener after it fires once


            if (toggleButton) toggleButton.classList.remove('active');
         }
        // Note: Visibility state isn't saved in localStorage in this version, it resets on load
        // To save it, you'd add a property like `notesVisible` to the task state
    }

    // --- Debounce function (limits how often a function can run) ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }


    // --- Save State to localStorage ---
    const saveState = debounce(() => {
         console.log("Saving state...");
         // Update the roadmapState object one last time before saving
         document.querySelectorAll('.task-item').forEach(taskItem => {
             const taskId = taskItem.dataset.taskId;
             if (!taskId) return;

             const statusIcon = taskItem.querySelector('.task-status-icon');
             const notesArea = taskItem.querySelector('textarea');
             const currentStatus = statusIcon ? (
                 statusIcon.classList.contains('not-started') ? 'not-started' :
                 statusIcon.classList.contains('in-progress') ? 'in-progress' : 'completed'
                 ) : 'not-started'; // Default if somehow missing

              if (!roadmapState.tasks[taskId]) {
                  roadmapState.tasks[taskId] = {}; // Ensure task exists in state
              }

             roadmapState.tasks[taskId].status = currentStatus;
              if (notesArea) {
                 roadmapState.tasks[taskId].notes = notesArea.value;
             }
         });

         document.querySelectorAll('.roadmap-stage').forEach(stage => {
              const stageId = stage.id;
             if (!stageId) return;
              const isCollapsed = stage.classList.contains('stage-collapsed');
              if (!roadmapState.stages[stageId]) {
                  roadmapState.stages[stageId] = {}; // Ensure stage exists in state
              }
              roadmapState.stages[stageId].collapsed = isCollapsed;
          });

        try {
            localStorage.setItem('worldbuildingRoadmap', JSON.stringify(roadmapState));
             console.log("State saved successfully.");
        } catch (error) {
            console.error("Failed to save state to localStorage:", error);
            // Potentially notify user that saving failed (e.g., storage full)
        }
    }, 500); // Debounce save operations by 500ms


    // --- Load State from localStorage ---
    function loadState() {
        const savedState = localStorage.getItem('worldbuildingRoadmap');
         let loadedSuccessfully = false;

        if (savedState) {
            try {
                roadmapState = JSON.parse(savedState);
                 console.log("Loaded state:", roadmapState);
                 loadedSuccessfully = true;
            } catch (error) {
                console.error("Failed to parse saved state:", error);
                 // Initialize default state structure if loading fails
                 initializeDefaultStateStructure(); // Create entries for items found in HTML
                localStorage.removeItem('worldbuildingRoadmap'); // Clear potentially corrupt data
            }
        } else {
            console.log("No saved state found, initializing default structure.");
             initializeDefaultStateStructure();
         }


        // Apply loaded state (or default structure) to the DOM
        // Tasks: Status and Notes
        Object.keys(roadmapState.tasks).forEach(taskId => {
            const taskItem = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
            if (taskItem) {
                const taskData = roadmapState.tasks[taskId];

                 // -- Apply Status --
                const statusIcon = taskItem.querySelector('.task-status-icon');
                 if (statusIcon && taskData.status) {
                     statusIcon.classList.remove('not-started', 'in-progress', 'completed');
                    statusIcon.classList.add(taskData.status);

                     let iconHtml = '';
                     let title = '';
                     switch (taskData.status) {
                         case 'in-progress': iconHtml = '<i class="fas fa-circle-notch fa-spin"></i>'; title = 'In Progress'; break;
                         case 'completed': iconHtml = '<i class="fas fa-check-circle"></i>'; title = 'Completed'; break;
                         case 'not-started': default: iconHtml = '<i class="far fa-circle"></i>'; title = 'Not Started'; break;
                     }
                     statusIcon.innerHTML = iconHtml;
                    statusIcon.title = title;
                }

                // -- Apply Notes --
                const notesArea = taskItem.querySelector('textarea');
                if (notesArea && taskData.notes !== undefined) {
                    notesArea.value = taskData.notes;
                }
                 // -- Apply Initial Notes Visibility (ensure they start hidden) --
                 const notesDiv = taskItem.querySelector('.task-notes');
                  if (notesDiv) {
                      notesDiv.style.display = 'block'; // Needed for immediate class effect & transitions later
                      notesDiv.classList.add('notes-hidden');
                      notesDiv.style.maxHeight = '0';
                      notesDiv.style.paddingTop = '0';
                      notesDiv.style.paddingBottom = '0';
                      notesDiv.style.marginTop = '0';
                      notesDiv.style.borderLeft = 'none';
                  }
            } else {
                console.warn(`Task element not found in HTML for loaded ID: ${taskId}. Removing from state.`);
                 delete roadmapState.tasks[taskId]; // Clean up state if element no longer exists
            }
        });

         // Stages: Collapsed State
        Object.keys(roadmapState.stages).forEach(stageId => {
             const stage = document.getElementById(stageId);
             if (stage) {
                 const stageData = roadmapState.stages[stageId];
                  const content = stage.querySelector('.stage-content');
                 const icon = stage.querySelector('.toggle-stage-details i');

                 if (stageData.collapsed) {
                     stage.classList.add('stage-collapsed');
                      if (content) {
                         content.style.maxHeight = '0';
                         content.style.paddingTop = '0';
                          content.style.paddingBottom = '0';
                      }
                       if(icon) icon.style.transform = 'rotate(-90deg)';
                 } else {
                     stage.classList.remove('stage-collapsed');
                     if (content) {
                         // Set to a large value initially, or calculate precisely if needed on load
                         // Setting explicit large value is usually simpler for load
                          content.style.maxHeight = '1000px'; // Or calculate scrollHeight if necessary
                          content.style.paddingTop = ''; // Reset to CSS default
                         content.style.paddingBottom = '';
                      }
                      if(icon) icon.style.transform = 'rotate(0deg)';

                 }
             } else {
                console.warn(`Stage element not found in HTML for loaded ID: ${stageId}. Removing from state.`);
                 delete roadmapState.stages[stageId]; // Clean up state if element no longer exists
             }
         });

        updateOverallProgress(); // Update progress bar after loading state
    }


     // --- Initialize Default State Structure from HTML ---
    // Call this if no saved state exists, or if loading fails
    function initializeDefaultStateStructure() {
        roadmapState.tasks = {}; // Reset
         roadmapState.stages = {}; // Reset

         document.querySelectorAll('.task-item').forEach(taskItem => {
             const taskId = taskItem.dataset.taskId;
             if (taskId && !roadmapState.tasks[taskId]) { // Check if not already added (e.g., during failed parse recovery)
                 roadmapState.tasks[taskId] = {
                     status: 'not-started', // Default status
                    notes: taskItem.querySelector('textarea')?.value || '' // Get initial text if any
                };
            }
        });
        document.querySelectorAll('.roadmap-stage').forEach(stage => {
            const stageId = stage.id;
             if (stageId && !roadmapState.stages[stageId]) {
                 roadmapState.stages[stageId] = {
                    collapsed: false // Default collapsed state (or check classList)
                };
            }
         });
         console.log("Initial state structure created from HTML:", roadmapState);
     }

    // --- Event Delegation Setup ---
    if (roadmapContainer) {
        roadmapContainer.addEventListener('click', (event) => {
            const target = event.target;

             // Target the button OR its icon
            const toggleStageButton = target.closest('.toggle-stage-details');
             if (toggleStageButton) {
                 toggleStage(toggleStageButton.closest('.roadmap-stage'));
                 return; // Handled
             }
             // Allow clicking anywhere on stage header to toggle too
            const stageHeader = target.closest('.stage-header');
            if(stageHeader && !target.closest('a, button:not(.toggle-stage-details)')) { // Don't toggle if clicking other buttons/links in header
                 // Check if the actual toggle button was clicked; if so, toggleStage was already called
                 if (!toggleStageButton) {
                     toggleStage(stageHeader.closest('.roadmap-stage'));
                      return; // Handled
                 }
            }


            const toggleNotesButton = target.closest('.toggle-notes');
            if (toggleNotesButton) {
                toggleNotes(toggleNotesButton.closest('.task-item'));
                 return; // Handled
             }


            const cycleStatusButton = target.closest('.cycle-status');
            if (cycleStatusButton) {
                 cycleTaskStatus(cycleStatusButton.closest('.task-item'));
                 return; // Handled
            }
         });


         // Save notes text when user types (debounced)
        roadmapContainer.addEventListener('input', (event) => {
            if (event.target.tagName === 'TEXTAREA' && event.target.closest('.task-notes')) {
                const taskItem = event.target.closest('.task-item');
                 const taskId = getTaskId(taskItem);
                 if (taskId && roadmapState.tasks[taskId]) {
                      roadmapState.tasks[taskId].notes = event.target.value;
                    saveState(); // Will be debounced
                }
             }
        });

     } else {
        console.error("Roadmap container not found!");
    }


     // --- Initialization ---
    function initialize() {
        loadState(); // Load saved data first (this will also setup initial structure if none)
         // `loadState` handles applying loaded status, notes, collapsed states and updates progress.
         // Any purely visual setup not handled by loading CSS or loadState can go here.
         console.log("Roadmap Initialized.");
    }

    initialize(); // Run initialization logic

}); // End DOMContentLoaded