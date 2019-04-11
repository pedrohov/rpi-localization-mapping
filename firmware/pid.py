class PIDcontroller():
    """
    """
    def __init__(self, kP, kI, kD):
        # PID previous value:
        self.P = 0;
        self.I = 0;
        self.D = 0;
        
        # PID constants:
        self.kP = kP;
        self.kI = kI;
        self.kD = kD;
        
        # Previous error, used for the derivate:
        self.previous_error = 0;

        # Sum of previous errors, used for the integral:
        self.sum_error = 0;
        
    def PID(self, setpoint, process_var, elapsed_time):
        
        # Calculate the error:
        error = process_var - setpoint;
        
        # Proportional value. Constant multiplied by the error:
        self.P = self.kP * error;
        
        # Integrate the value of the error, sum of the previous
        # integral part plus the error multiplied by its constant.
        self.sum_error += error;
        self.I = self.sum_error + self.kI;
        
        # The derivate is the value of the error given in the amount
        # of time passed since the last iteration:
        self.D = self.kD * ((error - self.previous_error) / elapsed_time);
        self.previous_error = error;
        
        # The PID value is the sum of each part:
        PID = self.P + self.I + self.D;
            
        return PID;