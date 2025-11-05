/**
 * Hop Dashboard Search Component
 * 
 * Multi-field search for hop dashboards with highlighting.
 * Searches across hop ID, name, description, and phase.
 * 
 * @module artifacts/controls/HopDashboardSearch
 */

/**
 * Hop task data structure (simplified from react_hop_dashboard.ts)
 */
export interface HopTask {
  id: string;
  name: string;
  status: 'planned' | 'in_progress' | 'completed';
  description: string;
  phase: string;
  estimatedLOC?: number;
  dependencies?: string[];
}

/**
 * Search result with match context
 */
export interface SearchResult {
  hop: HopTask;
  matchedFields: string[];
  score: number;
}

/**
 * Component for searching hop dashboard tasks
 */
export class HopDashboardSearch {
  /**
   * Search tasks by query across multiple fields
   * 
   * Case-insensitive search across id, name, description, and phase.
   * 
   * @param tasks Array of hop tasks to search
   * @param query Search query string
   * @returns Array of matching tasks with search results
   */
  searchTasks(tasks: HopTask[], query: string): SearchResult[] {
    if (!query || query.trim() === '') {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    for (const hop of tasks) {
      const matchedFields: string[] = [];
      let score = 0;

      // Search hop ID (highest priority)
      if (hop.id.toLowerCase().includes(normalizedQuery)) {
        matchedFields.push('id');
        score += 10;
      }

      // Search hop name
      if (hop.name.toLowerCase().includes(normalizedQuery)) {
        matchedFields.push('name');
        score += 5;
      }

      // Search description
      if (hop.description.toLowerCase().includes(normalizedQuery)) {
        matchedFields.push('description');
        score += 3;
      }

      // Search phase
      if (hop.phase.toLowerCase().includes(normalizedQuery)) {
        matchedFields.push('phase');
        score += 2;
      }

      // Add to results if any field matched
      if (matchedFields.length > 0) {
        results.push({ hop, matchedFields, score });
      }
    }

    // Sort by score descending (highest relevance first)
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Highlight search query matches in text
   * 
   * Wraps matching text in <mark> tags for client-side highlighting.
   * 
   * @param text Text to search within
   * @param query Search query
   * @returns Text with <mark> tags around matches
   */
  highlightMatches(text: string, query: string): string {
    if (!query || query.trim() === '') {
      return text;
    }

    // Escape regex special characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create case-insensitive regex with global flag
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    // Replace matches with <mark> tags
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  /**
   * Generate search box HTML for hop dashboard
   * 
   * @returns HTML string for search interface
   */
  generateSearchHTML(): string {
    return `
      <div class="hop-search">
        <input 
          type="search" 
          id="hop-search-input" 
          placeholder="Search hops (ID, name, description, phase)..."
          oninput="handleHopSearch(this.value)"
        />
        <div id="hop-search-results"></div>
      </div>
    `;
  }

  /**
   * Generate JavaScript code for client-side search
   * 
   * Returns JavaScript that performs search and updates DOM.
   * Used in artifact HTML <script> tags.
   * 
   * @param tasksJSON JSON string of all hop tasks
   * @returns JavaScript code string
   */
  generateSearchScript(tasksJSON: string): string {
    return `
      <script>
        // Hop tasks data
        const hopTasks = ${tasksJSON};

        // Handle search input
        function handleHopSearch(query) {
          const resultsDiv = document.getElementById('hop-search-results');
          
          if (!query || query.trim() === '') {
            resultsDiv.innerHTML = '';
            clearAllHighlights();
            return;
          }

          // Perform search
          const results = searchHopTasks(hopTasks, query);
          
          // Update results display
          if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="no-results">No matching hops found</div>';
          } else {
            const resultHTML = results.map(result => \`
              <div class="search-result" onclick="scrollToHop('\${result.hop.id}')">
                <div class="result-id">\${result.hop.id}</div>
                <div class="result-name">\${highlightText(result.hop.name, query)}</div>
                <div class="result-fields">Matched: \${result.matchedFields.join(', ')}</div>
              </div>
            \`).join('');
            resultsDiv.innerHTML = \`
              <div class="results-count">\${results.length} match\${results.length !== 1 ? 'es' : ''}</div>
              <div class="results-list">\${resultHTML}</div>
            \`;
          }

          // Highlight all matches in DOM
          highlightMatchesInDOM(query);
        }

        // Search hop tasks (client-side)
        function searchHopTasks(tasks, query) {
          const normalizedQuery = query.toLowerCase().trim();
          const results = [];

          for (const hop of tasks) {
            const matchedFields = [];
            let score = 0;

            if (hop.id.toLowerCase().includes(normalizedQuery)) {
              matchedFields.push('id');
              score += 10;
            }
            if (hop.name.toLowerCase().includes(normalizedQuery)) {
              matchedFields.push('name');
              score += 5;
            }
            if (hop.description.toLowerCase().includes(normalizedQuery)) {
              matchedFields.push('description');
              score += 3;
            }
            if (hop.phase.toLowerCase().includes(normalizedQuery)) {
              matchedFields.push('phase');
              score += 2;
            }

            if (matchedFields.length > 0) {
              results.push({ hop, matchedFields, score });
            }
          }

          return results.sort((a, b) => b.score - a.score);
        }

        // Highlight text matches (simple string replace for security)
        function highlightText(text, query) {
          if (!query) return text;
          // Case-insensitive indexOf-based replacement
          const lowerText = text.toLowerCase();
          const lowerQuery = query.toLowerCase();
          let result = '';
          let lastIndex = 0;
          let index = lowerText.indexOf(lowerQuery);
          
          while (index !== -1) {
            result += text.substring(lastIndex, index);
            result += '<mark class="search-highlight">';
            result += text.substring(index, index + query.length);
            result += '</mark>';
            lastIndex = index + query.length;
            index = lowerText.indexOf(lowerQuery, lastIndex);
          }
          result += text.substring(lastIndex);
          return result;
        }

        // Highlight all matches in DOM
        function highlightMatchesInDOM(query) {
          clearAllHighlights();
          
          const hopCards = document.querySelectorAll('.hop-card');
          const lowerQuery = query.toLowerCase();
          
          hopCards.forEach(card => {
            const textElements = card.querySelectorAll('.hop-name, .hop-description');
            textElements.forEach(el => {
              const originalText = el.getAttribute('data-original-text') || el.textContent;
              if (!el.hasAttribute('data-original-text')) {
                el.setAttribute('data-original-text', originalText);
              }
              
              if (originalText.toLowerCase().includes(lowerQuery)) {
                el.innerHTML = highlightText(originalText, query);
              }
            });
          });
        }

        // Clear all search highlights
        function clearAllHighlights() {
          const elements = document.querySelectorAll('[data-original-text]');
          elements.forEach(el => {
            const originalText = el.getAttribute('data-original-text');
            if (originalText) {
              el.textContent = originalText;
            }
          });
        }

        // Scroll to hop card
        function scrollToHop(hopId) {
          const hopCard = document.querySelector(\`[data-hop-id="\${hopId}"]\`);
          if (hopCard) {
            hopCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            hopCard.classList.add('highlighted');
            setTimeout(() => hopCard.classList.remove('highlighted'), 2000);
          }
        }
      </script>
    `;
  }
}
