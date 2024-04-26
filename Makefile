tetris: tetris.c
	emcc --post-js module-post.js -o tetris.html tetris.c -s NO_EXIT_RUNTIME=1 -s "EXPORTED_RUNTIME_METHODS=['ccall']"
