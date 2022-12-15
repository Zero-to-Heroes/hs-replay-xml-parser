rm -rf dist && tsc && 'cp' -rf dist/ /e/Source/zerotoheroes/firestone/core/node_modules/\@firestone-hs/hs-replay-xml-parser/

rm -rf dist && tsc && 'cp' -rf dist/ /e/Source/zerotoheroes/public-lambdas/trigger-build-match-stats/node_modules/\@firestone-hs/hs-replay-xml-parser/
rm -rf dist && tsc && 'cp' -rf dist/ /e/Source/zerotoheroes/public-lambdas/api-user-bgs-post-match-stats/node_modules/\@firestone-hs/hs-replay-xml-parser/

rm -rf dist && tsc && npm publish --access public
