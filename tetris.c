#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <sys/time.h>
#include <ncurses.h>

#define ROWS 20 // you can change height and width of table with ROWS and COLS 
#define COLS 10
#define TRUE 1
#define FALSE 0
#define MAXSHAPES 7
#define MAXNEXTPIECES 6

char table[ROWS][COLS] = {0};
char *Table[ROWS] = {0};
int score = 0;
char GameOn = TRUE;
suseconds_t timer = 400000; // decrease this to make it faster
int decrease = 1000;
int newLines = 0;

typedef struct {
    char array[4][4];
    char wasHold;
    int width, row, col;
} Shape;
Shape current, pieceHold, *hold = NULL;

Shape nextPiece[MAXNEXTPIECES];
int iNextPiece = 0, jNextPiece = MAXNEXTPIECES - 1;

Shape ShapesArray[MAXSHAPES]= {
	{{{0,'G','G',0},{'G','G',0,0}, {0,0,0,0}, {0,0,0,0}}, 0, 3}, //S shape     
	{{{'R','R',0,0},{0,'R','R',0}, {0,0,0,0}, {0,0,0,0}}, 0, 3}, //Z shape     
	{{{0,'P',0,0},{'P','P','P',0}, {0,0,0,0}, {0,0,0,0}}, 0, 3}, //T shape     
	{{{0,0,'O',0},{'O','O','O',0}, {0,0,0,0}, {0,0,0,0}}, 0, 3}, //L shape     
	{{{'B',0,0,0},{'B','B','B',0}, {0,0,0,0}, {0,0,0,0}}, 0, 3}, //flipped L shape    
	{{{'Y','Y',0,0},{'Y','Y',0,0}, {0,0,0,0}, {0,0,0,0}}, 0, 2}, //square shape
//	{{{0,1,0,0},{0,1,0,0}, {0,1,0,0}, {1,1,1,0}}, 'P', 4}, //long T shape     
	{{{0,0,0,0},{'C','C','C','C'}, {0,0,0,0}, {0,0,0,0}}, 0, 4}  //long bar shape
	// you can add any shape like it's done above. Don't be naughty.
};

char CopyMemShape(Shape *dst, Shape *org){
    int i;
	long long *orgL = (long long*)org, *dstL = (long long*)dst;
	if (dst == NULL || org == NULL)
		return 0;
	for (i = 0; i < sizeof(Shape) / sizeof(long long); i++)
		dstL[i] = orgL[i];
	i = i * sizeof(long long);
	for (i = i; i < sizeof(Shape); i++)
		dst[i] = org[i];
	return 1;
}

Shape CopyShape(Shape shape){
	Shape new_shape = {0};
    int i;
	char *org = (char*)&shape, *dst = (char*)&new_shape;
	long long *orgL = (long long*)org, *dstL = (long long*)dst;
	for (i = 0; i < sizeof(Shape) / sizeof(long long); i++)
		dstL[i] = orgL[i];
	i = i * sizeof(long long);
	for (i = i; i < sizeof(Shape); i++)
		dst[i] = org[i];
    return new_shape;
}

void DeleteShape(Shape shape){
    int i;
    for(i = 0; i < shape.width; i++){
//		free(shape.array[i]);
    }
//    free(shape.array);
}

int CheckPosition(Shape shape){ //Check the position of the copied shape
	int i, j;
	for(i = 0; i < shape.width;i++) {
		for(j = 0; j < shape.width ;j++){
			if((shape.col+j < 0 || shape.col+j >= COLS || shape.row+i >= ROWS)){ //Out of borders
				if(shape.array[i][j]) //but is it just a phantom?
					return FALSE;
				
			}
			else if(Table[shape.row+i][shape.col+j] && shape.array[i][j])
				return FALSE;
		}
	}
	return TRUE;
}

void SetNewRandomShape(){ //updates [current] with new shape
	Shape new_shape = nextPiece[iNextPiece];
    new_shape.col = rand()%(COLS-new_shape.width+1);
    new_shape.row = 0;
//    DeleteShape(current);
	current = new_shape;
	if(!CheckPosition(current)){
		GameOn = FALSE;
	}
	iNextPiece = (iNextPiece + 1) % MAXNEXTPIECES == 0 ? 0 : iNextPiece + 1;
	jNextPiece = (jNextPiece + 1) % MAXNEXTPIECES == 0 ? 0 : jNextPiece + 1;
	CopyMemShape(&nextPiece[jNextPiece],&ShapesArray[rand()%MAXSHAPES]);
}

void RotateShape(Shape *shape, char rotation){ //rotates clockwise
	Shape temp = CopyShape(*shape);
	int i, j, k, width;
	width = shape->width;
	for(i = 0; i < width ; i++)
		for(j = 0, k = width-1; j < width ; j++, k--)
			if (rotation == 'r')
				shape->array[i][j] = temp.array[k][i];
			else
				shape->array[k][i] = temp.array[i][j];
//	DeleteShape(temp);
}

void WriteToTable(){
	int i, j;
	for(i = 0; i < current.width ;i++){
		for(j = 0; j < current.width ; j++){
			if(current.array[i][j])
				Table[current.row+i][current.col+j] = current.array[i][j];
		}
	}
}

void RemoveFullRowsAndUpdateScore(){
	int i, j, sum, count=0;
	for(i=0;i<ROWS;i++){
		sum = 0;
		for(j=0;j< COLS;j++) {
			if (Table[i][j])
				sum += 1;
		}
		if(sum==COLS){
			count++;
			int l, k;
			char *cleanRow = Table[i];
			long long *erase = (long long*)cleanRow;
			for (k = i; k >= 1; k--)
				Table[k] = Table[k-1];
			Table[0] = cleanRow;
			for (k = 0; k < COLS/sizeof(long long); k++)
				erase[k] = 0;
			k = k * sizeof(long long);
			for (k = k; k < COLS; k++)
				cleanRow[k] = 0;
			timer-=decrease--;
		}
	}
	score += 100*count;
	if (count > 1){
		newLines -= count; 
	}
}

void AddPendingLines(){
	Shape temp = CopyShape(current);
	temp.row++;
	int i, j;
	while (CheckPosition(temp) && newLines > 0){
		char *incrementLine = Table[0];
		j = rand() % COLS;
		for (i = 0; i < COLS; i++)
			incrementLine[i] = i == j ? 0 : '#';
		for (i = 1; i < ROWS; i++)
			Table[i - 1] = Table[i];
		Table[ROWS - 1] = incrementLine;
		newLines--;
	}
}

void PrintTable(){
	char Buffer[ROWS][COLS] = {0};
	int i, j;
	for(i = 0; i < current.width ;i++){
		for(j = 0; j < current.width ; j++){
			if(current.array[i][j])
				Buffer[current.row+i][current.col+j] = current.array[i][j];
		}
	}
	clear();
	for(i=0; i<COLS-9; i++)
		printw(" ");
	printw("Covid Tetris NEXT: ");
	j = iNextPiece;
	for (i = 0; i < MAXNEXTPIECES; i++){
		printw("%c -> ", nextPiece[j].array[1][1]);
		j = (j + 1) % MAXNEXTPIECES == 0 ? 0 : j + 1;
	}
	printw(" HOLD: %c \n", hold == NULL ? ' ' : hold->array[1][1]);
	for(i = 0; i < ROWS ;i++){
		for(j = 0; j < COLS ; j++){
			printw("%c ", (Table[i][j] + Buffer[i][j])? (Buffer[i][j]?Buffer[i][j]:Table[i][j]): '.');
		}
		printw("\n");
	}
	printw("\nScore: %d\n", score);
}

void ManipulateCurrent(int action){
	Shape temp = CopyShape(current);
	switch(action){
		case 'w':
			if (newLines < 0)
				newLines = 0;
			temp.row++;  //move down
			while (CheckPosition(temp))
				temp.row++;
			current.row = temp.row - 1;
			WriteToTable();
			RemoveFullRowsAndUpdateScore();
            SetNewRandomShape();
			AddPendingLines();
			break;
		case 's':
			if (newLines < 0)
				newLines = 0;
			temp.row++;  //move down
			if(CheckPosition(temp))
				current.row++;
			else {
				WriteToTable();
				RemoveFullRowsAndUpdateScore();
                SetNewRandomShape();
				AddPendingLines();
			}
			break;
		case 'd':
			temp.col++;  //move right
			if(CheckPosition(temp))
				current.col++;
			break;
		case 'a':
			temp.col--;  //move left
			if(CheckPosition(temp))
				current.col--;
			break;
		case 'r':
			if (current.wasHold)
				break;
			if (hold == NULL){
				hold = &pieceHold;
				CopyMemShape(hold,&current);
				SetNewRandomShape();
				current.wasHold = 1;
			} else{
				CopyMemShape(&temp,&current);
				CopyMemShape(&current,hold);
				CopyMemShape(hold,&temp);
				current.col = rand()%(COLS-current.width+1);
				current.row = 0;
				current.wasHold = 1;
//			    DeleteShape(current);
				if(!CheckPosition(current)){
					GameOn = FALSE;
				}
			}
			break;
		case 'e':
			RotateShape(&temp, 'r'); // rotate clockwise
			if(CheckPosition(temp))
				RotateShape(&current,'r');
			break;
		case 'q':
			RotateShape(&temp, 'l'); // rotate anticlockwise
			if(CheckPosition(temp))
				RotateShape(&current,'l');
			break;
	}
//	DeleteShape(temp);
	PrintTable();
}

struct timeval before_now, now;
int hasToUpdate(){
	return ((suseconds_t)(now.tv_sec*1000000 + now.tv_usec) -((suseconds_t)before_now.tv_sec*1000000 + before_now.tv_usec)) > timer;
}

int main() {
    srand(time(0));
	for (int i = 0; i < ROWS; i++)
		Table[i] = table[i];
	for (int i = 0; i < MAXNEXTPIECES; i++){
		Shape new_shape = CopyShape(ShapesArray[rand()%MAXSHAPES]);
		CopyMemShape(&nextPiece[i], &new_shape);
	}
    score = 0;
    int c;
    initscr();
	gettimeofday(&before_now, NULL);
	timeout(1);
	SetNewRandomShape();
    PrintTable();
	int wait = 5;
	while(GameOn){
		if ((c = getch()) != ERR) {
		  ManipulateCurrent(c);
		}
		gettimeofday(&now, NULL);
		if (hasToUpdate()) { //time difference in microsec accuracy
			ManipulateCurrent('s');
			gettimeofday(&before_now, NULL);
			if (wait == 0){
				wait = 5;
				newLines += 1;
			} else wait--;
		}
	}
	DeleteShape(current);
	endwin();
	int i, j;
	for(i = 0; i < ROWS ;i++){
		for(j = 0; j < COLS ; j++){
			printf("%c ", Table[i][j] ? '#': '.');
		}
		printf("\n");
	}
	printf("\nGame ouvre!\n");
	printf("\nScore: %d\n", score);
    return 0;
}
