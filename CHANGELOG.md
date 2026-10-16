# Changelog

Notable changes to this project. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Topic: **Performance vs scalability**, with 5 concepts: Performance, Proportional Scaling, Algorithms That Don't Scale, Mixed (Heterogeneous) Servers and Design for Scale from the Start. Also a "Don't confuse" pair: Performance vs Scalability.

### Changed

- Scalability now lists Performance under "Know these first".
- Learning path: among concepts that are ready, bigger-picture concepts now come before details.

### Fixed

- The site was blank on GitHub Pages. The build now uses relative paths, and a workflow publishes the built site on every push to `main`.

## [0.1.0] - 2026-10-16

### Added

- First topic: **Scalability**, with 33 concepts. Each one has a plain-language explanation, a real-world example, good and watch-out points, a "Remember" line and "Learn more" links.
- Three modes:
  - **Learn**: a step-by-step path ordered by prerequisites, with progress tracking.
  - **Browse**: concepts grouped by concern, with back and previous / next navigation.
  - **Explore**: an animated local map of each concept's prerequisites, what it leads to, related concepts and "Don't confuse with" pairs.
- Search across all modes, light and dark themes, and phone layouts.
- `npm run check-data` to validate concept data, and a CI check on pull requests.
- Contributor docs: README, CONTRIBUTING (concept format and writing style guide), Code of Conduct, Security policy, issue and pull request templates.
- Licences: MIT for code, CC BY-SA 4.0 for learning content.
